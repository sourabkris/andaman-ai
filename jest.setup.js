import '@testing-library/jest-dom';
import 'whatwg-fetch';

global.fetch = jest.fn();

// jsdom does not implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = jest.fn();
