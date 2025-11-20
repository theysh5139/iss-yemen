const express = require('express')
const News = require('../models/News')
const jwt = require('jsonwebtoken')

const router = express.Router()

// Get all news (public)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0
    const query = News.find().sort({ publishDate: -1 })
    if (limit > 0) query.limit(limit)
    const news = await query
    res.json(news)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single news item
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
    if (!news) return res.status(404).json({ message: 'News not found' })
    res.json(news)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Create news (admin only)
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })

    const { title, body, author, publishDate } = req.body
    if (!title || !body || !author) {
      return res.status(400).json({ message: 'Title, body, and author are required' })
    }

    const news = await News.create({
      title,
      body,
      author,
      publishDate: publishDate ? new Date(publishDate) : new Date()
    })
    res.status(201).json(news)
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Update news (admin only)
router.put('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })

    const { title, body, author, publishDate } = req.body
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { title, body, author, publishDate: publishDate ? new Date(publishDate) : undefined },
      { new: true, runValidators: true }
    )
    if (!news) return res.status(404).json({ message: 'News not found' })
    res.json(news)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete news (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })

    const news = await News.findByIdAndDelete(req.params.id)
    if (!news) return res.status(404).json({ message: 'News not found' })
    res.json({ message: 'News deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router

