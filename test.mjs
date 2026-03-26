import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);
const client = generateClient();

async function run() {
    try {
        const res = await client.models.Service.list({ authMode: 'apiKey' });
        console.log(JSON.stringify(res, null, 2));
    } catch (e) { console.error(e) }
}
run();
