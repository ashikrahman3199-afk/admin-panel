import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api'; 
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

const client = generateClient();

async function run() {
    try {
        console.log("Fetching pending services using API Key to see if any exist...");
        const { data: services, errors: sErrors } = await client.models.Service.list({
            filter: { approvalStatus: { eq: 'pending' } },
            authMode: 'apiKey'
        });
        if (sErrors) {
            console.error("Service Errors:", sErrors);
        }
        console.log("Pending Services in database via API Key:", JSON.stringify(services, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
