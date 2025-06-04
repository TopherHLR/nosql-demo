// index.js
const express = require('express');
const path = require('path');
const db = require('./firebase-config');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// POST endpoint to add a new user
app.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        const docRef = await db.collection('users').add({ name, email });
        res.status(201).json({ id: docRef.id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET endpoint to fetch all users (with optional search)
app.get('/users', async (req, res) => {
    try {
        let usersQuery = db.collection('users');
        
        // Add search functionality if query parameter exists
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            // Note: Firestore doesn't support native OR queries or case-insensitive search
            // This is a basic implementation - you might need a better solution for production
            usersQuery = usersQuery
                .where('nameLower', '>=', searchTerm)
                .where('nameLower', '<=', searchTerm + '\uf8ff');
        }
        
        const usersSnapshot = await usersQuery.get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        res.status(200).json(users);
    } catch (err) {
        console.error('Error in /users:', err);
        res.status(400).json({ error: err.message });
    }
});

app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        const userRef = db.collection('users').doc(id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        await userRef.update(updatedData);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE endpoint to remove a user
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('users').doc(id).delete();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

app.use((req, res) => {
    console.log(`Unknown route: ${req.method} ${req.originalUrl}`);
    res.status(404).send('<h1>404 - Not Found</h1>');
});
