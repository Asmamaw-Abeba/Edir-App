import api from './api'; // Assuming this is your axios instance with x-language header

export const features = [
  {
    id: 1,
    title: "Easy Member Management",
    description: "Add, edit, and manage members with just a few clicks.",
  },
  {
    id: 2,
    title: "Track Contributions",
    description: "Keep track of member contributions and generate reports.",
  },
  {
    id: 3,
    title: "Event Planning",
    description: "Organize events and track attendance seamlessly.",
  },
];

export const fetchTestimonials = async () => {
  try {
    const response = await api.get('/api/contact');
    const data = response.data;
    // Map the backend data to the testimonial structure
    const formattedTestimonials = data.map((item, index) => ({
      id: item._id || index + 1, // Use MongoDB _id or fallback to index
      text: item.message,        // Use 'message' as testimonial text
      author: item.name,         // Use 'name' as author
    }));
    return formattedTestimonials;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    throw error; // Let the caller handle the error
  }
};