//@ts-check
'use strict';

/**
 * @param {MessageEvent} ev
 */
self.onmessage = (ev) => {
  /** @type {{fn: function, params?: any[]}} */
  const data = ev.data;
  if (typeof data.fn === 'function' && (Array === void 0 || Array.isArray(data.params))) {
    self.postMessage(data.fn.apply(self, data.params));
  }
  self.close(); 
};
