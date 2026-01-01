import mongoose from 'mongoose';

const aboutUsSchema = new mongoose.Schema(
  {
    mission: { type: String, required: true },
    vision: { type: String, required: true },
    activities: [
      {
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
      }
    ],
    joinUsText: { type: String, required: true }
  },
  { timestamps: true }
);

// Ensure only one document exists
aboutUsSchema.statics.getAboutUs = async function() {
  let aboutUs = await this.findOne();
  if (!aboutUs) {
    // Create default content
    aboutUs = await this.create({
      mission: 'The ISS Yemen club is dedicated to fostering unity, cultural exchange, and academic excellence among Yemeni students at UTM. We aim to create a supportive community that helps students thrive academically, socially, and culturally during their time in Malaysia.',
      vision: 'To be a leading student organization that empowers Yemeni students, preserves our cultural heritage, and builds bridges between Yemen and Malaysia through meaningful engagement, events, and collaborative initiatives.',
      activities: [
        {
          icon: '🎓',
          title: 'Academic Support',
          description: 'Providing academic materials, course resources, past-year papers, summaries, and study support for students from all faculties.'
        },
        {
          icon: '🎉',
          title: 'Cultural Events',
          description: 'Celebrating Yemeni heritage through cultural nights, festivals, traditional performances, and community cultural activities.'
        },
        {
          icon: '🤝',
          title: 'Community Building',
          description: 'Creating social programs, gatherings, support activities, and initiatives that strengthen relationships within the ISS Yemen community.'
        },
        {
          icon: '🎯',
          title: 'Student Activities & Engagement',
          description: 'Coordinating sports events, media and content creation, documentation, and logistical support for all ISS Yemen activities and programs.'
        }
      ],
      joinUsText: 'Whether you\'re a new student or have been at UTM for a while, we welcome all Yemeni students to join our community. Together, we can build a stronger, more connected student body.'
    });
  }
  return aboutUs;
};

export const AboutUs = mongoose.model('AboutUs', aboutUsSchema);







