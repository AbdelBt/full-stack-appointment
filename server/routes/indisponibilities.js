const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all indisponibilities /indisponibilities

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('indisponibilites')
            .select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
