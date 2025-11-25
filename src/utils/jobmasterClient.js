const axios = require('axios');

const JOBMASTER_URL = process.env.JOBMASTER_URL || 'http://localhost:3001';

async function triggerRecommendationJob(propertyId, userId, filters = {}) {
  try {

    // 🚀 Enviar solicitud al JobMaster
    const response = await axios.post(
      `${JOBMASTER_URL}/job`,
      { propertyId, userId, filters },
    );

    console.log('✅ Job de recomendación creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error comunicando con JobMaster:', error.message);
    throw error;
  }
}

module.exports = { triggerRecommendationJob };
