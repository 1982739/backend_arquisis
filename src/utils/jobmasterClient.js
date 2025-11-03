const axios = require('axios');
const authService = require('../../recomendation_workers/worker/src/utils/authService');

const JOBMASTER_URL = process.env.JOBMASTER_URL || 'http://localhost:3001';

async function triggerRecommendationJob(propertyId, userId, filters = {}, algorithm = 'basic') {
  try {
    // 🔑 Obtener token Auth0 desde tu servicio
    const token = await authService.getToken();

    // 🚀 Enviar solicitud al JobMaster
    const response = await axios.post(
      `${JOBMASTER_URL}/job`,
      { propertyId, userId, filters, algorithm },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Job de recomendación creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error comunicando con JobMaster:', error.message);
    throw error;
  }
}

module.exports = { triggerRecommendationJob };
