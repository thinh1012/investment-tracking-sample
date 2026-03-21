import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt

# 💼 AI Agent Interaction Matrix: Antigravity HQ
# Created by the [EXECUTIVE_MANAGER] for Mission Transparency

# 1. Define the Agents (Nodes)
agents = [
    "EXECUTIVE_MANAGER", "STRATEGIST", "SCOUT", 
    "DATA_COURIER", "ARCHITECT", "BUILDER", 
    "CRITIC", "DATA_ACCOUNTANT", "MOM_TAKER"
]

# 2. Define the Interaction Matrix (Relations)
# 1 = Direct Signal, 0 = No Direct Link
matrix_data = {
    "EXECUTIVE_MANAGER": [1, 1, 0, 0, 1, 0, 0, 1, 1],
    "STRATEGIST":        [1, 1, 1, 0, 0, 0, 0, 0, 0],
    "SCOUT":             [0, 1, 1, 1, 0, 0, 0, 0, 0],
    "DATA_COURIER":      [0, 0, 1, 1, 0, 0, 0, 1, 0],
    "ARCHITECT":         [1, 0, 0, 0, 1, 1, 0, 0, 0],
    "BUILDER":           [0, 0, 0, 0, 1, 1, 1, 0, 0],
    "CRITIC":            [1, 0, 0, 0, 1, 1, 1, 0, 0],
    "DATA_ACCOUNTANT":   [1, 0, 0, 1, 0, 0, 0, 1, 0],
    "MOM_TAKER":         [1, 0, 0, 0, 0, 0, 0, 0, 1]
}

df = pd.DataFrame(matrix_data, index=agents)

def display_matrix():
    print("\n--- 🛡️ Antigravity AI Interaction Matrix ---")
    print(df)
    print("\nLegend: 1 = Active Channel, 0 = No Direct Connection")

def visualize_graph():
    print("\n--- 🕸️ Generating Relationship Graph... ---")
    G = nx.DiGraph()
    
    # Add Nodes
    G.add_nodes_from(agents)
    
    # Add Edges based on Matrix
    for row_name, row in df.iterrows():
        for col_name, value in row.items():
            if value == 1 and row_name != col_name:
                G.add_edge(row_name, col_name)

    # Plot Settings
    plt.figure(figsize=(12, 8))
    pos = nx.spring_layout(G, seed=42)
    
    # Draw Nodes with specific colors
    colors = {
        "EXECUTIVE_MANAGER": "#1e293b",
        "STRATEGIST": "#450a0a",
        "SCOUT": "#064e3b",
        "DATA_COURIER": "#3b0764",
        "ARCHITECT": "#f59e0b",
        "BUILDER": "#ea580c",
        "CRITIC": "#d97706",
        "DATA_ACCOUNTANT": "#2563eb",
        "MOM_TAKER": "#475569"
    }
    node_colors = [colors.get(node, "gray") for node in G.nodes()]

    nx.draw(G, pos, with_labels=True, 
            node_color=node_colors, 
            node_size=3000, 
            font_size=8, 
            font_color="white", 
            font_weight="bold",
            edge_color="#cbd5e1",
            arrowsize=20)

    plt.title("Antigravity AI: Agent Interaction Nexus", fontsize=15, fontweight='bold')
    plt.show()

if __name__ == "__main__":
    display_matrix()
    # Note: visualize_graph() requires matplotlib/networkx installed
    try:
        visualize_graph()
    except Exception as e:
        print(f"\n[!] Visualization skipped: {e}")
        print("Tip: Install dependencies with 'pip install pandas networkx matplotlib'")
