const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream('test_pred.csv'));
        form.append('modelId', 'dummy');

        const res = await axios.post('http://localhost:3001/api/ml/predict', form, {
            headers: form.getHeaders()
        });
        console.log(res.data);
    } catch (e) {
        console.log("Status:", e.response?.status);
        console.log("Data:", JSON.stringify(e.response?.data, null, 2));
    }
}
test();
