import React from "react";

const TransactionHistory = ({ transactions, currentUserId }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div style={styles.container}>
                <h3 style={styles.title}>Transaction History</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
                    No transactions yet.
                </p>
            </div>
        );
    }

    // Helper to determine win/loss
    const getResult = (game) => {
        // Basic check: is the current user in the winners list?
        // Note: ensure currentUserId and winner IDs are compared correctly (strings vs objects)
        const isWinner = game.winner.some(
            (w) => w === currentUserId || w._id === currentUserId
        );
        return isWinner ? "WIN" : "LOSS";
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Transaction History</h3>
            <div style={styles.list}>
                {transactions.map((game, index) => {
                    const result = getResult(game);
                    const isWin = result === "WIN";

                    // Calculate Profit
                    // If Loss: Amount = Stake
                    // If Win: Amount = Reward Share. (Total Pool * 0.7) / Winner Count
                    // Total Pool = Stake * Loser Count.
                    // Note: If no losers, Reward is 0. You just get your stake back. 
                    // So "Profit" shown in history should probably just be the Reward amount?
                    // OR, should it show the Net change?
                    // Net Change:
                    // Loss: -Stake
                    // Win: +Reward (since Stake was returned, net gain is Reward).
                    // If Reward is 0 (no losers), Net Change is 0?
                    // Let's show the Reward amount as the + value.

                    let amount = game.stakeAmount;
                    if (isWin) {
                        const loserCount = game.losersPool?.length || 0;
                        const winnerCount = game.winner?.length || 1;
                        const poolAmount = game.stakeAmount * loserCount;
                        const rewardAmount = (poolAmount * 0.7) / winnerCount;
                        amount = rewardAmount;

                        // If amount is 0 (no losers), display 0 or maybe just the stake returned logic?
                        // The user might be confused if they see "+0". 
                        // But strictly speaking, they made 0 profit.
                    }

                    // Use game._id for date (timestamp embedded in Mongo ID)
                    const date = game._id
                        ? new Date(parseInt(game._id.substring(0, 8), 16) * 1000).toLocaleDateString()
                        : "Recent";

                    return (
                        <div key={index} style={styles.item}>
                            <div style={styles.left}>
                                <span style={styles.gameId}>Game #{index + 1}</span>
                                <span style={styles.date}>{date}</span>
                            </div>
                            <div style={styles.right}>
                                <span style={{ ...styles.amount, color: isWin ? "#4CAF50" : "#F44336" }}>
                                    {isWin ? "+" : "-"}${amount.toFixed(2)}
                                </span>
                                <span style={styles.result}>{result}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: "90vw",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        padding: "20px",
        marginTop: "20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    title: {
        color: "white",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "15px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "10px",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxHeight: "300px",
        overflowY: "auto",
    },
    item: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
    },
    left: {
        display: "flex",
        flexDirection: "column",
    },
    right: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
    },
    gameId: {
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
    },
    date: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "12px",
    },
    amount: {
        fontWeight: "bold",
        fontSize: "16px",
    },
    result: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "12px",
        textTransform: "uppercase",
    },
};

export default TransactionHistory;
