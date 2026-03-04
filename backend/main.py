from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
import json
import shutil
import threading
import time

app = FastAPI(title="Quant Trading Platform API")

# Process Management for Jesse
class JesseProcessManager:
    def __init__(self):
        self.process = None
        self.logs = []
        self.is_running = False
        self.last_command = ""
        self.start_time = 0
        self.finish_time = 0

    def run_command(self, command, cwd):
        if self.is_running:
            return False, "A process is already running"
        
        self.is_running = True
        self.logs = []
        self.last_command = command
        self.start_time = time.time()
        self.finish_time = 0

        def runner():
            try:
                self.process = subprocess.Popen(
                    command,
                    cwd=cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    shell=True
                )
                for line in self.process.stdout:
                    self.logs.append(line)
                    if len(self.logs) > 2000:
                        self.logs.pop(0)
                
                self.process.wait()
            except Exception as e:
                self.logs.append(f"CRITICAL ERROR: {str(e)}")
            finally:
                self.is_running = False
                self.finish_time = time.time()
        
        thread = threading.Thread(target=runner)
        thread.daemon = True
        thread.start()
        return True, "Started"

    def get_status(self):
        return {
            "is_running": self.is_running,
            "logs": self.logs[-50:], # Return last 50 logs for polling
            "last_command": self.last_command,
            "runtime": round(time.time() - self.start_time, 2) if self.is_running else round(self.finish_time - self.start_time, 2)
        }

    def stop_process(self):
        if self.process and self.is_running:
            self.process.terminate()
            self.is_running = False
            self.finish_time = time.time()
            self.logs.append("--- PROCESS TERMINATED BY USER ---")
            return True, "Stopped"
        return False, "No process running"

jesse_mgr = JesseProcessManager()

# Allow all CORS for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STRATEGIES_DIR = "strategies"

class StrategyUpdate(BaseModel):
    code: str

class StrategyCreate(BaseModel):
    name: str

class CandleImportRequest(BaseModel):
    exchange: str
    symbol: str
    start_date: str

class BacktestRequest(BaseModel):
    start_date: str
    finish_date: str

class OptimizeRequest(BaseModel):
    start_date: str
    finish_date: str
    optimal_total: int = 10
    cpu_cores: int = 2

class LiveRequest(BaseModel):
    exchange: str
    symbol: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Quant Platform API is running"}

@app.get("/backtest/results")
def get_backtest_results():
    # Jesse saves JSON reports in /storage/json/
    json_dir = os.path.join("storage", "json")
    if not os.path.exists(json_dir):
        return {"results": None, "error": "No results found in storage/json"}
    
    # Get the latest JSON file
    files = [os.path.join(json_dir, f) for f in os.listdir(json_dir) if f.endswith(".json")]
    if not files:
        return {"results": None}
    
    latest_file = max(files, key=os.path.getmtime)
    with open(latest_file, "r") as f:
        data = json.load(f)
    
    return {"results": data, "filename": os.path.basename(latest_file)}

@app.get("/strategies")
def list_strategies():
    if not os.path.exists(STRATEGIES_DIR):
        return {"strategies": []}
    
    strategies = [d for d in os.listdir(STRATEGIES_DIR) if os.path.isdir(os.path.join(STRATEGIES_DIR, d)) and not d.startswith("__")]
    return {"strategies": strategies}

@app.get("/strategies/{name}")
def get_strategy(name: str):
    strategy_path = os.path.join(STRATEGIES_DIR, name, "__init__.py")
    if not os.path.exists(strategy_path):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    with open(strategy_path, "r") as f:
        code = f.read()
    
    return {"name": name, "code": code}

@app.post("/strategies")
def create_strategy(strategy: StrategyCreate):
    name = strategy.name
    strategy_dir = os.path.join(STRATEGIES_DIR, name)
    
    if os.path.exists(strategy_dir):
        raise HTTPException(status_code=400, detail="Strategy already exists")
    
    os.makedirs(strategy_dir)
    
    template = f"""from jesse.strategies import Strategy, Cached
import jesse.indicators as ta
from jesse import utils

class {name}(Strategy):
    def should_long(self) -> bool:
        return False

    def should_short(self) -> bool:
        return False

    def go_long(self):
        pass

    def go_short(self):
        pass

    def should_cancel_entry(self) -> bool:
        return True

    def filters(self):
        return []
"""
    with open(os.path.join(strategy_dir, "__init__.py"), "w") as f:
        f.write(template)
    
    return {"status": "created", "name": name}

@app.put("/strategies/{name}")
def update_strategy(name: str, update: StrategyUpdate):
    strategy_path = os.path.join(STRATEGIES_DIR, name, "__init__.py")
    if not os.path.exists(strategy_path):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    with open(strategy_path, "w") as f:
        f.write(update.code)
    
    return {"status": "updated"}

@app.delete("/strategies/{name}")
def delete_strategy(name: str):
    strategy_dir = os.path.join(STRATEGIES_DIR, name)
    if not os.path.exists(strategy_dir):
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    shutil.rmtree(strategy_dir)
    return {"status": "deleted"}

@app.get("/configs/{filename}")
def get_config(filename: str):
    if filename not in ["config.py", "routes.py"]:
        raise HTTPException(status_code=400, detail="Invalid config file")
    
    file_path = filename
    if not os.path.exists(file_path):
        # Return empty if doesn't exist yet
        return {"filename": filename, "code": ""}
    
    with open(file_path, "r") as f:
        code = f.read()
    
    return {"filename": filename, "code": code}

@app.put("/configs/{filename}")
def update_config(filename: str, update: StrategyUpdate):
    if filename not in ["config.py", "routes.py"]:
        raise HTTPException(status_code=400, detail="Invalid config file")
    
    file_path = filename
    with open(file_path, "w") as f:
        f.write(update.code)
    
    return {"status": "updated"}

@app.get("/jesse/status")
def get_jesse_status():
    return jesse_mgr.get_status()

@app.post("/candles/import")
def import_candles(req: CandleImportRequest):
    if req.exchange.lower() == 'yfinance':
        command = f"python yfinance_importer.py {req.symbol} {req.start_date}"
    else:
        command = f"jesse import-candles '{req.exchange}' '{req.symbol}' {req.start_date}"
    
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.post("/backtest")
async def run_backtest(req: BacktestRequest):
    # We use --json to get a structured report if possible, or just raw output
    command = f"jesse backtest {req.start_date} {req.finish_date}"
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.post("/optimize")
async def run_optimize(req: OptimizeRequest):
    # jesse optimize <start_date> <finish_date> --optimal-total <total> --cpu-cores <cores>
    command = f"jesse optimize {req.start_date} {req.finish_date} --optimal-total {req.optimal_total} --cpu-cores {req.cpu_cores}"
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.post("/live/start")
def start_live(req: LiveRequest):
    # In a real scenario, this would be 'jesse live <exchange> <symbol>'
    # For now, we simulate with a command that outputs periodic logs
    command = f"echo Starting live trading for {req.symbol} on {req.exchange}... && python -c \"import time; [print(f'Signal: BUY {req.symbol} at {100+i}') or time.sleep(2) for i in range(50)]\""
    success, message = jesse_mgr.run_command(command, os.getcwd())
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "started", "message": message}

@app.post("/live/stop")
def stop_live():
    success, message = jesse_mgr.stop_process()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "stopped", "message": message}

@app.get("/live/metrics")
def get_live_metrics():
    # Mock live metrics
    return {
        "balance": 10250.45,
        "equity": 10285.12,
        "pnl": 34.67,
        "active_positions": [
            {"symbol": "BTC-USDT", "type": "LONG", "entry": 42500, "current": 42650, "pnl": 150.00}
        ]
    }

@app.get("/quant/correlation")
def get_correlation_matrix():
    # Mock correlation data for demonstration
    # In a real app, this would calculate Pearson correlation of returns
    strategies = ["TrendFollowing", "MeanReversion", "HODL", "DCA"]
    matrix = [
        [1.0, -0.2, 0.85, 0.5],
        [-0.2, 1.0, -0.4, 0.1],
        [0.85, -0.4, 1.0, 0.6],
        [0.5, 0.1, 0.6, 1.0]
    ]
    return {"strategies": strategies, "matrix": matrix}

@app.get("/quant/benchmark")
def get_benchmark_data():
    # Mock benchmark comparison vs BTC
    import random
    data = []
    base_price = 10000
    btc_price = 30000
    
    for i in range(30):
        base_price *= (1 + random.uniform(-0.02, 0.03))
        btc_price *= (1 + random.uniform(-0.03, 0.04))
        data.append({
            "date": f"2023-01-{i+1:02d}",
            "strategy": round(base_price, 2),
            "benchmark": round(btc_price, 2)
        })
    return {"data": data}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
