const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cron = require("node-cron");

const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: "abdella.boutaarourt@hotmail.com",
        pass: "abdel-9600",
    },
});
// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getAvailableEmployeForTimeSlot = async (date, timeSlot) => {
    try {
        // Récupérer tous les utilisateurs
        const { data: allUsers, error: fetchUsersError } = await supabase.auth.admin.listUsers()

        if (fetchUsersError) {
            throw new Error(`Erreur lors de la récupération des utilisateurs: ${fetchUsersError.message}`);
        }

        // Parcourir tous les employés pour trouver un employé disponible
        for (const user of allUsers.users) {
            // Vérifier s'il existe des indisponibilités pour cet employé à ce créneau horaire
            const { data: existingIndisponibilities, error: fetchError } = await supabase
                .from("reservations")
                .select("*")
                .eq("date", date)
                .eq("time_slot", timeSlot)
                .eq("employe_id", user.id);

            if (fetchError) {
                throw fetchError;
            }

            // S'il n'y a pas d'indisponibilités, cet employé est disponible
            if (existingIndisponibilities.length === 0) {
                return user.id; // Retourner l'ID du premier employé disponible
            }
        }

        return null; // Aucun employé disponible trouvé
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'employé disponible :', error.message);
        throw error; // Lancer l'erreur pour la gérer plus haut
    }
};


// Route POST pour créer une réservation
router.post("/", async (req, res) => {
    try {
        const {
            service,
            date,
            timeSlot,
            clientName,
            clientEmail,
            clientFirstname,
            phoneNumber,
            description,
        } = req.body;

        const paymentIntentId = req.body.paymentIntentId;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({ error: "Le paiement n'a pas été réussi." });
        }

        const employeId = await getAvailableEmployeForTimeSlot(date, timeSlot);

        if (!employeId) {
            return res.status(400).json({ error: "Aucun employé disponible pour ce créneau." });
        }


        // Insérer la réservation dans la table des réservations
        const { data: reservationData, error: reservationError } = await supabase
            .from("reservations")
            .insert([
                {
                    service: service,
                    date: date,
                    description: description,
                    time_slot: timeSlot,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_phone: phoneNumber,
                    status: "pending",
                    client_firstname: clientFirstname,
                    employe_id: employeId,
                },
            ]);

        if (reservationError) throw reservationError;

        const formattedDate = new Date(date);
        const formattedDateString = formattedDate.toLocaleDateString("fr-FR", {
            month: "long",
            day: "numeric",
        });

        // Configurer l'e-mail de confirmation
        const mailOptions = {
            from: "abdella.boutaarourt@hotmail.com",
            to: clientEmail,
            subject: "Confirmation de réservation",
            html: `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <h1>Bonjour ${clientFirstname} ${clientName}</h1>
        <p>Votre réservation pour ${service} le ${formattedDateString} à ${timeSlot} a été planifié.</p>
        <p style="font-weight:bold">Détails de la réservation :</p>
        <ul>
          <li>Service : ${service}</li>
          <li>Date : ${date}</li>
          <li>Heure : ${timeSlot}</li>
          <li>Description : ${description}</li>
        </ul>
        <p>Merci de nous avoir choisis.</p>
        <p>Cordialement,<br>L'equipe House Of Beauty</p>
          <div style="text-align: center; ">
          <img src="https://i.goopics.net/lr3a9d.png" alt="Logo" style="max-width: 200px;">
        </div>
      </body>
    </html>
  `,
        };

        // Envoyer l'e-mail de confirmation
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Erreur lors de l'envoi de l'e-mail:", error);
            } else {
                console.log("E-mail envoyé:", info.response);
            }
        });

        res
            .status(201)
            .json({ message: "Reservation created successfully", reservationData });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Route GET pour récupérer les réservations
router.get("/", async (req, res) => {
    try {
        const { data: allUsers, error: fetchUsersError } = await supabase.auth.admin.listUsers()

        if (fetchUsersError) {
            throw new Error(`Erreur lors de la récupération des utilisateurs: ${fetchUsersError.message}`);
        }

        const { data: reservations, error } = await supabase
            .from("reservations")
            .select("*");

        if (error) throw error;

        // Construire un tableau d'IDs uniques d'employés à partir des reservation
        const employeeIdsFromIndisponibilites = [...new Set(reservations.map(reservation => reservation.employe_id))];

        // Construire un tableau d'IDs uniques d'employés à partir de tous les utilisateurs
        const allEmployeeIds = allUsers.users.map(user => user.id);

        // Fusionner les IDs d'employés pour s'assurer que tous les IDs uniques sont inclus
        const uniqueEmployeeIds = [...new Set([...allEmployeeIds, ...employeeIdsFromIndisponibilites])];


        res.status(200).json({ reservations: reservations, employeeIds: uniqueEmployeeIds });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

router.post("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Mettre à jour le statut de la réservation dans la table des réservations
        const { data: updatedReservation, error } = await supabase
            .from("reservations")
            .update({ status: status })
            .eq("id", id);

        if (error) throw error;

        res.status(200).json(updatedReservation);
    } catch (error) {
        console.error("Error updating reservation status:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Nouvelle route POST pour mettre à jour le service d'une réservation
router.post("/:id/service", async (req, res) => {
    try {
        const { id } = req.params;
        const { service } = req.body;

        // Mettre à jour le service de la réservation dans la table des réservations
        const { data: updatedReservation, error } = await supabase
            .from("reservations")
            .update({ service: service })
            .eq("id", id);

        if (error) throw error;
        res.status(200).json(updatedReservation);
    } catch (error) {
        console.error("Error updating reservation service:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Route DELETE pour supprimer une réservation
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Supprimer la réservation de la table des réservations
        const { data, error } = await supabase
            .from("reservations")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.status(200).json({ message: "Reservation deleted successfully", data });
    } catch (error) {
        console.error("Error deleting reservation:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Tâche planifiée pour supprimer les réservations plus de 2 mois
cron.schedule("0 0 1 * *", async () => { // Exécuter à minuit le 1er de chaque mois
    try {
        // Calculer la date limite (2 mois avant la date actuelle)
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Convertir en format ISO pour la comparaison avec la base de données
        const formattedDate = twoMonthsAgo.toISOString();

        // Supprimer les réservations qui ont une date antérieure à twoMonthsAgo
        const { data, error } = await supabase
            .from("reservations")
            .delete()
            .lt("date", formattedDate);

        if (error) throw error;

        console.log("Réservations plus de 2 mois supprimées avec succès:", data);
    } catch (error) {
        console.error("Erreur lors de la suppression des réservations plus de 2 mois :", error.message);
    }
});

module.exports = router;
