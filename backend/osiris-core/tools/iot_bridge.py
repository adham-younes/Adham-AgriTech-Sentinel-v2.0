import time
import random

class IoTBridge:
    def __init__(self):
        self.gateway_id = "OSIRIS_IOT_GATE_01"
        self.connected_sensors = 142
        self.connected_actuators = 18

    def read_soil_moisture(self, sensor_id):
        # Simulate sensor reading
        moisture = random.uniform(10, 45)
        print(f"📡 [GAIA] Polling Sensor {sensor_id}... Reading: {moisture:.1f}%")
        return moisture

    def control_irrigation(self, valve_id, action="OPEN"):
        print(f"💧 [GAIA] Sending Signal to Valve {valve_id}...")
        time.sleep(0.5)
        if action == "OPEN":
            print(f"    >>> 🟢 VALVE OPENED. Water flowing.")
        else:
            print(f"    >>> 🔴 VALVE CLOSED. Flow stopped.")
        return True

if __name__ == "__main__":
    bridge = IoTBridge()
    m = bridge.read_soil_moisture("SENSOR_X99")
    if m < 20:
        print("⚠️  [GAIA] Critical Moisture Deficit Detected!")
        bridge.control_irrigation("VALVE_MAIN_01", "OPEN")
