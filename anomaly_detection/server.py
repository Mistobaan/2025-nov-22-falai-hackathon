"""FastAPI server for Anomalib model inference."""
import io
import base64
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

import numpy as np
import torch
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
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


def apply_jet_colormap(image_data) -> np.ndarray:
    """
    Apply jet colormap to a grayscale anomaly map.
    
    Args:
        image_data: Tensor or numpy array (grayscale)
        
    Returns:
        RGB numpy array with jet colormap applied
    """
    # Convert to numpy if needed
    if isinstance(image_data, torch.Tensor):
        image_array = image_data.detach().cpu().numpy()
    else:
        image_array = image_data
    
    # Ensure 2D array (grayscale)
    if len(image_array.shape) == 3:
        if image_array.shape[0] == 1:
            image_array = image_array.squeeze(0)
        elif image_array.shape[2] == 1:
            image_array = image_array.squeeze(2)
    
    # Normalize to 0-1 range
    if image_array.dtype in [np.float32, np.float64]:
        if image_array.min() < 0 or image_array.max() > 1:
            image_array = (image_array - image_array.min()) / (image_array.max() - image_array.min() + 1e-8)
    else:
        image_array = image_array.astype(np.float32) / 255.0
    
    # Apply jet colormap
    cmap = plt.get_cmap('jet')
    colored = cmap(image_array)
    
    # Convert to RGB (remove alpha channel) and scale to 0-255
    rgb_array = (colored[:, :, :3] * 255).astype(np.uint8)
    
    return rgb_array


def overlay_anomaly_on_image(original_image, anomaly_map, alpha=0.4):
    """
    Overlay the colored anomaly map on the original image.
    
    Args:
        original_image: Original image (numpy array or tensor)
        anomaly_map: Anomaly map (numpy array or tensor, grayscale)
        alpha: Transparency of the overlay (0.0 = invisible, 1.0 = opaque)
        
    Returns:
        RGB numpy array with anomaly overlay
    """
    # Convert original image to numpy if needed
    if isinstance(original_image, torch.Tensor):
        orig_array = original_image.detach().cpu().numpy()
    else:
        orig_array = np.array(original_image)
    
    # Handle different shapes for original image
    if len(orig_array.shape) == 3 and orig_array.shape[0] in [1, 3]:
        orig_array = np.transpose(orig_array, (1, 2, 0))
    
    # Ensure original is RGB and uint8
    if len(orig_array.shape) == 2:
        orig_array = np.stack([orig_array] * 3, axis=-1)
    
    if orig_array.dtype != np.uint8:
        if orig_array.max() <= 1.0:
            orig_array = (orig_array * 255).astype(np.uint8)
        else:
            orig_array = orig_array.astype(np.uint8)
    
    # Apply jet colormap to anomaly map
    colored_anomaly = apply_jet_colormap(anomaly_map)
    
    # Resize anomaly map to match original image if needed
    if orig_array.shape[:2] != colored_anomaly.shape[:2]:
        from PIL import Image as PILImage
        colored_anomaly_pil = PILImage.fromarray(colored_anomaly)
        colored_anomaly_pil = colored_anomaly_pil.resize(
            (orig_array.shape[1], orig_array.shape[0]), 
            PILImage.LANCZOS
        )
        colored_anomaly = np.array(colored_anomaly_pil)
    
    # Blend the images
    overlay = (alpha * colored_anomaly + (1 - alpha) * orig_array).astype(np.uint8)
    
    return overlay


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
        - anomaly_map: Base64 encoded saliency/anomaly map with jet colormap
        - anomaly_overlay: Base64 encoded original image with anomaly map overlay
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
        
        # Add anomaly map if available (with jet colormap)
        if hasattr(predictions, 'anomaly_map') and predictions.anomaly_map is not None:
            colored_anomaly_map = apply_jet_colormap(predictions.anomaly_map)
            response["anomaly_map"] = image_to_base64(colored_anomaly_map)
            
            # Also create an overlay version
            overlay = overlay_anomaly_on_image(image_array, predictions.anomaly_map, alpha=0.4)
            response["anomaly_overlay"] = image_to_base64(overlay)
        
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
