const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


router.post('/', async (req, res) => {
    const { from_date, to_date } = req.body;

    try {
        // Vérifier s'il existe déjà des enregistrements de dates disponibles
        const { data: existingDates, error } = await supabase
            .from('available_dates')
            .select('id, from_date, to_date');

        if (error) {
            throw error;
        }

        if (existingDates && existingDates.length > 0) {
            // S'il y a des enregistrements existants, gérer selon votre logique
            // Par exemple, vous pouvez mettre à jour le premier enregistrement trouvé
            const existingRecord = existingDates[0];
            const { data: updatedDates, error: updateError } = await supabase
                .from('available_dates')
                .update({ from_date, to_date })
                .eq('id', existingRecord.id)
                .single(); // Utilisez .single() pour mettre à jour uniquement un enregistrement

            if (updateError) {
                throw updateError;
            }

            res.status(200).json(updatedDates);
        } else {
            // Aucun enregistrement existant, insérer une nouvelle entrée
            const { data: newDates, error: insertError } = await supabase
                .from('available_dates')
                .insert([{ from_date, to_date }])
                .single();

            if (insertError) {
                throw insertError;
            }

            res.status(201).json(newDates);
        }
    } catch (error) {
        console.error('Error adding or updating available dates:', error.message);
        res.status(500).json({ error: 'Failed to add or update available dates' });
    }
});


// Route GET pour récupérer toutes les périodes de dates disponibles
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('available_dates').select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching available dates:', error.message);
        res.status(500).json({ error: 'Failed to fetch available dates' });
    }
});


module.exports = router;
