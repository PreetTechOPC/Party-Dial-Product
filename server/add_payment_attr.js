const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function addAttr() {
    try {
        await databases.createStringAttribute(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_PAYMENTS_COLLECTION_ID || 'payments',
            'invoiceFileId',
            255,
            false
        );
        console.log("invoiceFileId attribute added!");
    } catch(err) {
        console.error("Error adding invoiceFileId:", err.message);
    }
}

addAttr();
