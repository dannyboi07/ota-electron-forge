import React from "react";

function Base({ children }: { children: React.ReactNode }) {
    return (
        <main
            style={{
                width: "100vw",
                height: "100vh",
                backgroundColor: "black",
                color: "white",
            }}
        >
            {children}
        </main>
    );
}

export default Base;
