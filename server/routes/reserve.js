const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route POST pour créer une réservation
router.post('/', async (req, res) => {
    try {
        const { service, date, timeSlot, clientName, clientEmail, clientFirstname, phoneNumber } = req.body;

        const paymentIntentId = req.body.paymentIntentId; // Supposons que vous recevez l'ID du paiement depuis le frontend

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Le paiement n\'a pas été réussi.' });
        }

        // Vérifier si la date et l'heure sont déjà marquées comme indisponibles
        const { data: existingIndisponibilities, error: fetchError } = await supabase
            .from('indisponibilites')
            .select('*')
            .eq('jour', date)
            .eq('heure', timeSlot);

        if (fetchError) {
            throw fetchError;
        }

        if (existingIndisponibilities.length > 0) {
            return res.status(400).json({ error: 'La date et l\'heure spécifiées sont déjà indisponibles.' });
        }

        // Insérer la réservation dans la table des réservations
        const { data: reservationData, error: reservationError } = await supabase
            .from('reservations')
            .insert([
                {
                    service: service,
                    date: date,
                    time_slot: timeSlot,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_phone: phoneNumber,
                    status: 'confirmed',
                    client_firstname: clientFirstname,

                }
            ]);

        if (reservationError) throw reservationError;

        // Insérer la date réservée dans la table des indisponibilités
        const { data: unavailableData, error: unavailableError } = await supabase
            .from('indisponibilites')
            .insert([
                {
                    jour: date,
                    heure: timeSlot
                }
            ]);

        if (unavailableError) throw unavailableError;

        res.status(201).json({ message: 'Reservation created successfully', reservationData });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/appointment', async (req, res) => {
    try {
        const { service, date, timeSlot, clientName, clientEmail, clientFirstname, phoneNumber, description } = req.body;



        // Vérifier si la date et l'heure sont déjà marquées comme indisponibles
        const { data: existingIndisponibilities, error: fetchError } = await supabase
            .from('indisponibilites')
            .select('*')
            .eq('jour', date)
            .eq('heure', timeSlot);

        if (fetchError) {
            throw fetchError;
        }

        if (existingIndisponibilities.length > 0) {
            return res.status(400).json({ error: 'La date et l\'heure spécifiées sont déjà indisponibles.' });
        }

        // Insérer la réservation dans la table des réservations
        const { data: reservationData, error: reservationError } = await supabase
            .from('reservations')
            .insert([
                {
                    description: description,
                    service: service,
                    date: date,
                    time_slot: timeSlot,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_phone: phoneNumber,
                    status: 'pending',
                    client_firstname: clientFirstname,

                }
            ]);

        if (reservationError) throw reservationError;

        // Insérer la date réservée dans la table des indisponibilités
        const { data: unavailableData, error: unavailableError } = await supabase
            .from('indisponibilites')
            .insert([
                {
                    jour: date,
                    heure: timeSlot
                }
            ]);

        if (unavailableError) throw unavailableError;

        res.status(201).json({ message: 'Reservation created successfully', reservationData });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route GET pour récupérer les réservations
router.get('/', async (req, res) => {
    try {
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select('*');

        if (error) throw error;

        res.status(200).json(reservations);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Mettre à jour le statut de la réservation dans la table des réservations
        const { data: updatedReservation, error } = await supabase
            .from('reservations')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;

        res.status(200).json(updatedReservation);
    } catch (error) {
        console.error('Error updating reservation status:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Nouvelle route POST pour mettre à jour le service d'une réservation
router.post('/:id/service', async (req, res) => {
    try {
        const { id } = req.params;
        const { service } = req.body;

        // Mettre à jour le service de la réservation dans la table des réservations
        const { data: updatedReservation, error } = await supabase
            .from('reservations')
            .update({ service: service })
            .eq('id', id);

        if (error) throw error;
        res.status(200).json(updatedReservation);
    } catch (error) {
        console.error('Error updating reservation service:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route DELETE pour supprimer une réservation
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Supprimer la réservation de la table des réservations
        const { data, error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'Reservation deleted successfully', data });
    } catch (error) {
        console.error('Error deleting reservation:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
