import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api'; // or aws-amplify/data
// For Next.js to run this as node, we can read amplify_outputs directly
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

const client = generateClient();

async function run() {
    try {
        console.log("Fetching Service Options...");
        const { data: options, errors: oErrors } = await client.models.ServiceOption.list({
            authMode: 'apiKey'
        });
        if (oErrors) {
            console.error("Option Errors:", oErrors);
        }
        console.log("Service Options:", JSON.stringify(options, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
