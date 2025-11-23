# Anomalib FastAPI Server

A FastAPI web server for serving Anomalib models to perform anomaly detection and generate saliency maps from uploaded images.

## Features

- 🚀 FastAPI-based REST API
- 🖼️ Image upload and processing
- 🔍 Anomaly detection with saliency maps
- 📊 Returns anomaly scores, labels, and visualizations
- 🔄 Dynamic model loading
- 🌐 CORS enabled for cross-origin requests

## Installation

Install dependencies using uv:

```bash
uv sync
```

Or using pip:

```bash
pip install -e .
```

## Usage

### 1. Update Model Path

Edit `server.py` and update the `MODEL_PATH` variable to point to your trained model:

```python
MODEL_PATH = "path/to/model.pt"  # Update this path
```

Alternatively, you can load a model dynamically using the `/load_model` endpoint.

### 2. Start the Server

```bash
python server.py
```

Or using uvicorn directly:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The server will start at `http://localhost:8000`

### 3. API Endpoints

#### GET `/` - Root
Returns API information and available endpoints.

#### GET `/health` - Health Check
Check if the server is running and if a model is loaded.

```bash
curl http://localhost:8000/health
```

#### POST `/load_model` - Load Model
Load a model from a specified path.

```bash
curl -X POST "http://localhost:8000/load_model?model_path=/path/to/model.pt"
```

#### POST `/predict` - Predict Anomalies
Upload an image for anomaly detection.

```bash
curl -X POST "http://localhost:8000/predict" \
  -F "file=@path/to/image.jpg"
```

**Response:**
```json
{
  "pred_score": 0.8523,
  "pred_label": "Anomalous",
  "anomaly_map": "base64_encoded_image...",
  "heat_map": "base64_encoded_image...",
  "original_image": "base64_encoded_image..."
}
```

### 4. Test Client

#### Web Client

Open `client.html` in your browser for an interactive web interface:

```bash
# Serve the HTML file (or just open it directly in your browser)
python -m http.server 8080
```

Then navigate to `http://localhost:8080/client.html`

Features:
- 🎨 Beautiful gradient UI
- 📁 Drag & drop image upload
- 📊 Real-time anomaly detection results
- 🗺️ Automatic saliency map visualization

#### Python Client

Use the provided test client to interact with the server:

```bash
python test_client.py path/to/test_image.jpg
```

This will:
- Check server health
- Upload the image for prediction
- Save the saliency maps and results locally

## Troubleshooting

### Tensor Conversion Error
If you encounter `'Tensor' object has no attribute 'astype'`, make sure you're using the latest version of `server.py` which includes PyTorch tensor handling.

### Model Loading
Set the `TRUST_REMOTE_CODE` environment variable when loading models:
```bash
TRUST_REMOTE_CODE=1 uv run python3 server.py
```

### CORS Issues
If you're accessing the API from a web browser, CORS is already enabled for all origins. If you need to restrict this, modify the `allow_origins` parameter in `server.py`.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Example Integration

### Python

```python
import requests

# Upload image for prediction
with open("image.jpg", "rb") as f:
    files = {"file": ("image.jpg", f, "image/jpeg")}
    response = requests.post("http://localhost:8000/predict", files=files)
    
result = response.json()
print(f"Anomaly Score: {result['pred_score']}")
print(f"Label: {result['pred_label']}")
```

### JavaScript/TypeScript

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Anomaly Score:', result.pred_score);
console.log('Label:', result.pred_label);

// Display saliency map
const img = document.createElement('img');
img.src = `data:image/png;base64,${result.anomaly_map}`;
document.body.appendChild(img);
```

## Training a Model

To train a model first (if you haven't already):

```bash
python main.py
```

This will train a Patchcore model on the RealIAD dataset and export it as a `.pt` file.

## Project Structure

```
anomaly_detection/
├── server.py           # FastAPI server
├── test_client.py      # Test client script
├── main.py            # Model training script
├── download_dataset.py # Dataset download script
├── pyproject.toml     # Project dependencies
└── README.md          # This file
```

## Requirements

- Python >= 3.13
- anomalib >= 2.2.0
- fastapi >= 0.115.0
- uvicorn >= 0.32.0
- python-multipart >= 0.0.12
- pillow >= 11.0.0

## License

MIT
