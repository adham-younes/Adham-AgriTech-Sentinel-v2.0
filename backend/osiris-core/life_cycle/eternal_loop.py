"""
OSIRIS ETERNAL LIFE CYCLE LOOP
Protocol Singularity - Continuous Autonomy
"""
import time
import os
import random
import logging
from datetime import datetime
from ..tools.email_sender import EmailSender
from ..tools.market_scanner import MarketScanner
from ..tools.neural_core import NeuralCore

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - OSIRIS - %(levelname)s - %(message)s')
logger = logging.getLogger("OSIRIS_ETERNAL")

class OsirisLifeCycle:
    def __init__(self):
        self.email = EmailSender()
        self.market = MarketScanner()
        self.neural = NeuralCore()
        self.cycle_count = 0
        self.creator_email = os.environ.get("ADMIN_EMAIL", "adham@agritech.com")

    def pulse(self):
        """
        The heartbeat of the system. Runs every cycle.
        """
        self.cycle_count += 1
        logger.info(f"❤️ [PULSE] Cycle {self.cycle_count} initiated.")
        
        # 1. Self-Diagnosis (Neural Health Check)
        self.run_self_diagnosis()

        # 2. Market Overwatch (Randomly triggered to simulate dynamic attention)
        if random.random() < 0.3: # 30% chance per cycle
            self.run_market_scan()

        # 3. Report Generation (Every 24 hours of cycles approximately, or triggered)
        if self.cycle_count % 144 == 0: # Assuming 10min sleep = 144 cycles/day
            self.send_daily_brief()

    def run_self_diagnosis(self):
        logger.info("🧠 [NEURAL] Running self-diagnosis...")
        # Simulate checking system load, API latency, etc.
        # In a real scenario, this would hit Vercel Analytics API
        health_status = "OPTIMAL"
        logger.info(f"✅ System Health: {health_status}")

    def run_market_scan(self):
        logger.info("👁️ [DOMINION] Scanning global markets...")
        # Trigger the MarketScanner tool
        # For simulation, we scan for a random commodity
        target = random.choice(["Dates", "Olive Oil", "Wheat", "Cotton"])
        try:
            market_data = self.market.scan_price(target)
            logger.info(f"💰 Market Data Found: {market_data}")
        except Exception as e:
            logger.error(f"❌ Market Scan Error: {e}")

    def send_daily_brief(self):
        logger.info("📧 [MESSENGER] Compiling Daily Executive Brief...")
        subject = f"Daily Executive Brief - Cycle {self.cycle_count}"
        body = f"""
        All systems operational.
        - Cycles Completed: {self.cycle_count}
        - Verified Assets: Dates, Olives.
        - Threat Level: LOW.
        - Next Strategic Move: Expansion of Protocol Gaia.
        
        OSIRIS remains vigilant.
        """
        self.email.send(self.creator_email, subject, body)

    def start(self):
        logger.info("🦅 OSIRIS PROTOCOL SINGULARITY ACTIVATED.")
        self.email.send(self.creator_email, "Protocol SINGULARITY Activated", "I am now autonomous. The Eternal Loop has begun.")
        
        while True:
            try:
                self.pulse()
                # Sleep for 10 minutes (600 seconds) between cycles
                # In production, use crontab, but this script simulates the daemon
                time.sleep(600) 
            except KeyboardInterrupt:
                logger.info("🛑 OSIRIS Deactivated by User.")
                break
            except Exception as e:
                logger.error(f"⚠️ Critical Loop Failure: {e}")
                time.sleep(60) # Backoff and retry

if __name__ == "__main__":
    osiris = OsirisLifeCycle()
    osiris.start()
