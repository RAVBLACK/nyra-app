"""
Create a small sample WISDM dataset for testing
Use this if you can't download the real dataset
"""

import numpy as np
import os

def create_sample_wisdm_data():
    """
    Create a synthetic WISDM-like dataset for testing
    WARNING: This is for testing only - not accurate for production!
    """
    print("=" * 60)
    print("Creating Sample WISDM Dataset")
    print("=" * 60)
    print("\n⚠️  WARNING: This is synthetic data for TESTING ONLY")
    print("For production, download the real WISDM dataset\n")
    
    data_dir = "data"
    os.makedirs(data_dir, exist_ok=True)
    
    output_file = os.path.join(data_dir, "WISDM_ar_v1.1_raw.txt")
    
    # Activity patterns (simplified)
    activities = {
        'Walking': {'mean': [0.5, 0.2, 9.8], 'std': [2.0, 2.0, 1.5], 'freq': 0.5},
        'Jogging': {'mean': [1.0, 0.5, 10.0], 'std': [4.0, 4.0, 3.0], 'freq': 1.0},
        'Upstairs': {'mean': [0.3, 0.3, 11.0], 'std': [2.5, 2.5, 2.0], 'freq': 0.6},
        'Downstairs': {'mean': [0.2, 0.2, 8.5], 'std': [2.5, 2.5, 2.0], 'freq': 0.6},
        'Sitting': {'mean': [0.0, 0.0, 9.8], 'std': [0.3, 0.3, 0.2], 'freq': 0.05},
        'Standing': {'mean': [0.0, 0.0, 9.8], 'std': [0.5, 0.5, 0.3], 'freq': 0.1},
    }
    
    samples_per_activity = 50000  # 50k samples per activity
    users = 10  # 10 synthetic users
    
    print("Generating synthetic sensor data...")
    
    with open(output_file, 'w') as f:
        timestamp = 0
        
        for activity_name, params in activities.items():
            print(f"  {activity_name}...")
            
            for user in range(1, users + 1):
                for sample in range(samples_per_activity // users):
                    # Generate base signal
                    base = np.random.randn(3) * params['std'] + params['mean']
                    
                    # Add periodic movement
                    t = sample * 0.05  # 20 Hz
                    periodic = np.sin(2 * np.pi * params['freq'] * t) * 0.5
                    
                    x = base[0] + periodic
                    y = base[1] + periodic * 0.5
                    z = base[2] + periodic * 0.3
                    
                    # WISDM format: user,activity,timestamp,x,y,z;
                    line = f"{user},{activity_name},{timestamp},{x:.6f},{y:.6f},{z:.6f};\n"
                    f.write(line)
                    
                    timestamp += 50  # 50ms intervals (20 Hz)
    
    print(f"\n✅ Sample dataset created!")
    print(f"📊 File: {output_file}")
    print(f"📈 Total samples: {len(activities) * samples_per_activity:,}")
    print("\n⚠️  Remember: This is for TESTING only!")
    print("Download real WISDM data for production use")
    
    return output_file

if __name__ == '__main__':
    create_sample_wisdm_data()
