// Invented counts for the motion gallery.
export const chartSpecs = [24, 60, 84].map((tickets, step) => ({
  mark: { type: "bar", cornerRadius: 0 } as const,
  data: [
    { desk: "North", tickets },
    { desk: "South", tickets: 48 },
  ],
  encoding: {
    x: { field: "desk", type: "nominal" as const, axis: { title: "Service desk" } },
    y: {
      field: "tickets",
      type: "quantitative" as const,
      scale: { domain: [0, 100] },
      axis: { title: "Tickets" },
    },
  },
  animation: { enter: step > 0, update: true },
}));
