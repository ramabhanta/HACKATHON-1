"""
Automated unit and integration test for ML inference pipeline.
"""
from app.pipeline import run_inference_pipeline, validate_image_payload, CONFIDENCE_THRESHOLD

def test_pipeline():
    print("Testing ML Crop Disease Inference Pipeline...")

    # 1. Test Groundnut Tikka diagnosis
    gn_res = run_inference_pipeline("Groundnut")
    assert gn_res["isConfident"] is True
    assert "Tikka" in gn_res["possibleDisease"]
    assert gn_res["confidence"] >= CONFIDENCE_THRESHOLD
    print(f"PASS: Groundnut -> {gn_res['possibleDisease']} (Confidence: {gn_res['confidence']*100:.1f}%)")

    # 2. Test Tomato Early Blight
    tm_res = run_inference_pipeline("Tomato")
    assert tm_res["isConfident"] is True
    assert "Early Blight" in tm_res["possibleDisease"]
    print(f"PASS: Tomato -> {tm_res['possibleDisease']} (Confidence: {tm_res['confidence']*100:.1f}%)")

    # 3. Test Rice Blast
    rc_res = run_inference_pipeline("Rice")
    assert "Blast" in rc_res["possibleDisease"]
    print(f"PASS: Rice -> {rc_res['possibleDisease']} (Confidence: {rc_res['confidence']*100:.1f}%)")

    # 4. Test image payload validator
    assert validate_image_payload("image/jpeg", 1024 * 500) is True
    assert validate_image_payload("application/x-msdownload", 500) is False
    assert validate_image_payload("image/png", 15 * 1024 * 1024) is False
    print("PASS: Image validation guards working correctly.")

    print("\nAll ML pipeline tests passed successfully!")

if __name__ == "__main__":
    test_pipeline()
