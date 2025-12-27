import api from './api';

const getSpareParts = async (params) => {
    return await api.get('/spare-parts', { params });
};

const uploadSparePartsCSV = async (partsData) => {
    return await api.post('/spare-parts/upload', { parts: partsData });
};

const SparePartService = {
    getSpareParts,
    uploadSparePartsCSV
};

export default SparePartService;
