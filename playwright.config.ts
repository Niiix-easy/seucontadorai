import { createLovableConfig } from "lovable-agent-playwright-config/config";

export default createLovableConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
});
