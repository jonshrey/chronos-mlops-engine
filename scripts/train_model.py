import numpy as np
from sklearn.ensemble import IsolationForest
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# 1. Generate fake training data (Normal trades vs. Massive Whales)
# Features: [Price, Volume]
normal_trades = np.random.normal(loc=[50000, 0.5], scale=[1000, 0.2], size=(1000, 2))
whale_trades = np.random.normal(loc=[51000, 15.0], scale=[500, 5.0], size=(20, 2))
X_train = np.vstack([normal_trades, whale_trades])

# 2. Train the Anomaly Detector (Isolation Forest)
model = IsolationForest(contamination=0.02, random_state=42)
model.fit(X_train)

# 3. Convert and Save the model to ONNX format
initial_type = [('float_input', FloatTensorType([None, 2]))]
onnx_model = convert_sklearn(model, initial_types=initial_type)

with open("fraud_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

print("✅ Saved 'fraud_model.onnx'. Move this file to your Java backend's resources folder!")