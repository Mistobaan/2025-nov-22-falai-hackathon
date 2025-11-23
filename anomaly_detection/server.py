"""FastAPI server for Anomalib model inference."""
import io
import base64
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from anomalib.deploy import TorchInferencer

# Global model instance
model: Optional[TorchInferencer] = None
MODEL_PATH = "/home/raphael/development/bfl_hackathon/results/Patchcore/problem/v8/weights/torch/model.pt"  # Update this path


def tensor_to_python(value):
    """Convert PyTorch tensor or numpy type to Python native type."""
    if isinstance(value, torch.Tensor):
        # Convert tensor to Python scalar or list
        value = value.detach().cpu()
        if value.numel() == 1:
            return value.item()
        return value.numpy().tolist()
    elif isinstance(value, np.ndarray):
        if value.size == 1:
            return value.item()
        return value.tolist()
    elif isinstance(value, (np.integer, np.floating)):
        return value.item()
    return value


def image_to_base64(image_data) -> str:
    """Convert numpy array or PyTorch tensor to base64 encoded string."""
    # Convert PyTorch tensor to numpy if needed
    if isinstance(image_data, torch.Tensor):
        image_array = image_data.detach().cpu().numpy()
    else:
        image_array = image_data
    
    # Handle different array shapes
    # If shape is (C, H, W), transpose to (H, W, C)
    if len(image_array.shape) == 3 and image_array.shape[0] in [1, 3]:
        image_array = np.transpose(image_array, (1, 2, 0))
    
    # If single channel, squeeze it
    if len(image_array.shape) == 3 and image_array.shape[2] == 1:
        image_array = image_array.squeeze(axis=2)
    
    # Normalize to 0-255 range if needed
    if image_array.dtype == np.float32 or image_array.dtype == np.float64:
        # Check if values are in [0, 1] range
        if image_array.min() >= 0 and image_array.max() <= 1:
            image_array = (image_array * 255).astype(np.uint8)
        else:
            # Normalize to 0-255
            image_array = ((image_array - image_array.min()) / (image_array.max() - image_array.min()) * 255).astype(np.uint8)
    elif image_array.dtype != np.uint8:
        image_array = image_array.astype(np.uint8)
    
    # Convert to PIL Image
    # Handle grayscale vs RGB
    if len(image_array.shape) == 2:
        pil_image = Image.fromarray(image_array, mode='L')
    else:
        pil_image = Image.fromarray(image_array, mode='RGB')
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    
    # Encode to base64
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Load the model
    global model
    try:
        model_path = Path(MODEL_PATH)
        if not model_path.exists():
            print(f"Warning: Model file not found at {MODEL_PATH}")
            print("Please update MODEL_PATH in server.py or use the /load_model endpoint")
        else:
            model = TorchInferencer(path=str(model_path))
            print(f"Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Server started but model is not loaded. Use /load_model endpoint to load a model.")
    
    yield
    
    # Shutdown: cleanup if needed
    print("Shutting down server...")


app = FastAPI(
    title="Anomalib Inference Server",
    description="API for anomaly detection and saliency map generation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Anomalib Inference Server",
        "model_loaded": model is not None,
        "endpoints": {
            "/predict": "POST - Upload an image for anomaly detection",
            "/load_model": "POST - Load a model from a specified path",
            "/health": "GET - Check server health"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/load_model")
async def load_model_endpoint(model_path: str):
    """Load a model from the specified path."""
    global model
    try:
        path = Path(model_path)
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Model file not found at {model_path}")
        
        model = TorchInferencer(path=str(path))
        return {
            "message": "Model loaded successfully",
            "model_path": model_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict anomalies in an uploaded image and return saliency map.
    
    Args:
        file: Uploaded image file
        
    Returns:
        JSON response containing:
        - pred_score: Anomaly score
        - pred_label: Predicted label (normal/anomalous)
        - anomaly_map: Base64 encoded saliency/anomaly map
        - heat_map: Base64 encoded heat map visualization
        - original_image: Base64 encoded original image
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please load a model first using /load_model endpoint."
        )
    
    try:
        # Read uploaded file
        contents = await file.read()
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(contents))
        
        # Convert to numpy array for processing
        image_array = np.array(image)
        
        # Save temporarily for prediction (anomalib expects file path or numpy array)
        temp_path = "/tmp/temp_upload.jpg"
        image.save(temp_path)
        
        # Run prediction
        predictions = model.predict(image=temp_path)
        
        # Extract results
        response = {
            "pred_score": tensor_to_python(predictions.pred_score),
            "pred_label": str(predictions.pred_label),
        }
        
        # Add anomaly map if available
        if hasattr(predictions, 'anomaly_map') and predictions.anomaly_map is not None:
            response["anomaly_map"] = image_to_base64(predictions.anomaly_map)
        
        # Add heat map if available
        if hasattr(predictions, 'heat_map') and predictions.heat_map is not None:
            response["heat_map"] = image_to_base64(predictions.heat_map)
        
        # Add segmentation map if available
        if hasattr(predictions, 'pred_mask') and predictions.pred_mask is not None:
            response["pred_mask"] = image_to_base64(predictions.pred_mask)
        
        # Include original image
        response["original_image"] = image_to_base64(image_array)
        
        return JSONResponse(content=response)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error processing image: {str(e)}")
        print(f"Traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
