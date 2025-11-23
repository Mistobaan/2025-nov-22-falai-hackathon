"""Example client to test the Anomalib FastAPI server."""
import requests
import base64
from pathlib import Path
from PIL import Image
import io


def test_health():
    """Test the health endpoint."""
    response = requests.get("http://162.243.85.187:8000/health")
    print("Health Check:", response.json())


def test_predict(image_path: str, output_dir: str = "."):
    """
    Test the predict endpoint with an image.
    
    Args:
        image_path: Path to the image file
        output_dir: Directory to save output images (default: current directory)
    """
    # Check if file exists
    if not Path(image_path).exists():
        print(f"Error: Image file not found at {image_path}")
        return
    
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Generate timestamp for unique filenames
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = Path(image_path).stem
    
    # Open and send the image
    with open(image_path, "rb") as f:
        files = {"file": (Path(image_path).name, f, "image/jpeg")}
        response = requests.post("http://162.243.85.187:8000/predict", files=files)
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nPrediction Results:")
        print(f"  Anomaly Score: {result['pred_score']:.4f}")
        print(f"  Predicted Label: {result['pred_label']}")
        
        # Save the anomaly map if available
        if "anomaly_map" in result:
            filename = output_path / f"{base_name}_anomaly_map_{timestamp}.png"
            save_base64_image(result["anomaly_map"], str(filename))
            print(f"  ✅ Anomaly map saved to: {filename}")
        
        # Save the anomaly overlay if available
        if "anomaly_overlay" in result:
            filename = output_path / f"{base_name}_anomaly_overlay_{timestamp}.png"
            save_base64_image(result["anomaly_overlay"], str(filename))
            print(f"  ✅ Anomaly overlay saved to: {filename}")
        
        # Save heat map if available
        if "heat_map" in result:
            filename = output_path / f"{base_name}_heat_map_{timestamp}.png"
            save_base64_image(result["heat_map"], str(filename))
            print(f"  ✅ Heat map saved to: {filename}")
        
        # Save original image
        if "original_image" in result:
            filename = output_path / f"{base_name}_original_{timestamp}.png"
            save_base64_image(result["original_image"], str(filename))
            print(f"  ✅ Original image saved to: {filename}")
        
        # Save prediction mask if available
        if "pred_mask" in result:
            filename = output_path / f"{base_name}_pred_mask_{timestamp}.png"
            save_base64_image(result["pred_mask"], str(filename))
            print(f"  ✅ Prediction mask saved to: {filename}")
            
        print(f"\n📁 All outputs saved to: {output_path.absolute()}")
    else:
        print(f"❌ Error: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"Details: {error_detail}")
        except:
            print(f"Response: {response.text}")


def save_base64_image(base64_string: str, output_path: str):
    """
    Save a base64 encoded image to a file.
    
    Args:
        base64_string: Base64 encoded image string
        output_path: Path to save the image
    """
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    image.save(output_path)


def test_load_model(model_path: str):
    """
    Test loading a model.
    
    Args:
        model_path: Path to the model file
    """
    response = requests.post(
        "http://162.243.85.187:8000/load_model",
        params={"model_path": model_path}
    )
    print("Load Model:", response.json())


if __name__ == "__main__":
    import sys
    
    # Test health
    print("Testing server health...")
    test_health()
    
    # Test prediction if image path provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        output_dir = sys.argv[2] if len(sys.argv) > 2 else "./output"
        
        print(f"\nTesting prediction with image: {image_path}")
        print(f"Output directory: {output_dir}")
        test_predict(image_path, output_dir)
    else:
        print("\nUsage: python test_client.py <path_to_image> [output_directory]")
        print("Example: python test_client.py test_image.jpg ./results")
        print("         python test_client.py test_image.jpg  (saves to ./output)")
    
    # Example: Load a different model
    # test_load_model("path/to/another/model.pt")
