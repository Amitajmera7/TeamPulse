export function getGreeting(name = "Amit"): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Good Morning, ${name} 👋`;
  }

  if (hour < 17) {
    return `Good Afternoon, ${name} 👋`;
  }

  return `Good Evening, ${name} 👋`;
}
