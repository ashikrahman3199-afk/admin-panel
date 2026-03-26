import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api'; 
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

const client = generateClient();

async function run() {
    try {
        console.log("Fetching vendors...");
        const { data, errors } = await client.models.Vendor.list({
            authMode: 'apiKey'
        });
        if (errors) {
            console.error("Errors:", errors);
        }
        console.log("Vendors:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
