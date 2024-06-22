const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'User logged in successfully', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route POST pour créer un compte utilisateur
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Créer un utilisateur avec Supabase Auth
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        // Vous pouvez ajouter d'autres traitements ici, comme l'envoi de courriels de vérification, etc.

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

module.exports = router;
