const { Schema, model } = require('mongoose')

const NewsSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: String, required: true },
    publishDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = model('News', NewsSchema)

