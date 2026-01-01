import { AboutUs } from '../models/AboutUs.model.js';

// Get About Us content (public)
export async function getAboutUs(req, res, next) {
  try {
    const aboutUs = await AboutUs.getAboutUs();
    return res.json({ aboutUs });
  } catch (err) {
    next(err);
  }
}

// Update About Us content (admin only)
export async function updateAboutUs(req, res, next) {
  try {
    const { mission, vision, activities, joinUsText } = req.body;

    let aboutUs = await AboutUs.findOne();
    
    if (!aboutUs) {
      // Create if doesn't exist
      aboutUs = await AboutUs.create({
        mission: mission || '',
        vision: vision || '',
        activities: activities || [],
        joinUsText: joinUsText || ''
      });
    } else {
      // Update existing
      if (mission !== undefined) aboutUs.mission = mission;
      if (vision !== undefined) aboutUs.vision = vision;
      if (activities !== undefined) aboutUs.activities = activities;
      if (joinUsText !== undefined) aboutUs.joinUsText = joinUsText;
      await aboutUs.save();
    }

    return res.json({ message: 'About Us content updated successfully', aboutUs });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}







