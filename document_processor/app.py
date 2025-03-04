import logging
import requests
import time
from flask import Flask, request, jsonify
from termcolor import colored

app = Flask(__name__)

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Health Check route
@app.route('/health', methods=['GET'])
def health_check():
    try:
        logger.info("Health check successful")
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/process-document', methods=['POST'])
def process_document():
    try:
        data = request.get_json()

        document_id = data.get('document_id')
        document_name = data.get('document_name')
        document_url = data.get('document_url')
        callback_url = data.get('callback_url')

        if not document_id:
            logger.error("Error: No document ID provided")
            return jsonify({"status": "failed", "error": "No document ID provided"}), 400

        # Log the start of the document processing
        logger.info(f"Processing document: {document_name} {document_url}")

        # Notify the callback URL with status 'processing'
        logger.info(f"Notifying callback URL: {callback_url} with status 'processing'")
        requests.post(callback_url, json={"status": "processing", "document_id": document_id})

        # Simulate document processing with a delay
        time.sleep(10)

        # Notify the callback URL with status 'completed'
        response_data = {"status": "completed", "document_id": document_id, "document_name": document_name}
        logger.info(f"Notifying callback URL: {callback_url} with status 'completed'")
        requests.post(callback_url, json=response_data)

        logger.info(f"Document processed successfully: {document_name} {document_url}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return jsonify({"status": "failed", "error": "An error occurred during processing."}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 3000")
    app.run(host='0.0.0.0', port=3000)
