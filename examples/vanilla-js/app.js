import { ContentfulLivePreview } from '@contentful/live-preview';
import { createClient } from 'contentful';
import dotenv from 'dotenv';

// Configuration object
const CONFIG = {
  locale: 'en-US',
  entryId: 'W9z8t0uXz3CMFjp4sw5zj',
  fields: ['title'],
  subscriptions: [],
  debugMode: true,
};

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  dotenv.config();

  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
    host: 'preview.contentful.com',
  });

  ContentfulLivePreview.init({ locale: CONFIG.locale });

  client
    .getEntry(CONFIG.entryId)
    .then((entry) => {
      CONFIG.fields.forEach((fieldId) => {
        displayFieldData(entry, client, fieldId);
        setupLivePreview(entry, fieldId);
      });
    })
    .catch((err) => console.error(err));
}

function findElementByDataAttributes(entryId, fieldId) {
  return document.querySelector(
    `[data-contentful-entry-id="${entryId}"][data-contentful-field-id="${fieldId}"]`
  );
}

function displayFieldData(entry, client, fieldId) {
  const domElement = findElementByDataAttributes(CONFIG.entryId, fieldId);

  if (!domElement) {
    console.error(
      `DOM element with entry ID "${CONFIG.entryId}" and field ID "${fieldId}" not found.`
    );
    return;
  }

  domElement.textContent = entry.fields[fieldId];
}

function setupLivePreview(entry, fieldId) {
  const callback = (updatedData) => {
    const domElement = findElementByDataAttributes(CONFIG.entryId, fieldId);
    if (domElement && updatedData.fields && updatedData.fields[fieldId]) {
      // Check if the content is text
      if (typeof updatedData.fields[fieldId] === 'string') {
        domElement.textContent = updatedData.fields[fieldId];
      }
    }
  };

  const unsubscribe = ContentfulLivePreview.subscribe({
    data: entry,
    locale: CONFIG.locale,
    callback,
  });

  CONFIG.subscriptions.push(unsubscribe);
}
