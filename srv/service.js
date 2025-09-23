const cds = require('@sap/cds');
const FormData = require("form-data");
const stream = require('stream');
const mime = require("mime-types");
const { executeHttpRequest } = require("@sap-cloud-sdk/core");

module.exports = cds.service.impl(async function () {
  
  //GET All Repositories 
    this.on('GetRepositories', async (req) => {
    console.log("GetRepositories called");  // Check if action is triggered

    try {
      console.log("Connecting to DMSAdmin destination...");
      const sdm = await cds.connect.to('DMSAdmin');
      console.log("Connected to DMSAdmin destination:", sdm !== undefined);

      const response = await sdm.send({
        method: 'GET',
        path: '/rest/v2/repositories'
      });

      console.log("Full SDM Response:", response);
      //return JSON.stringify(response);
      return response;
    } catch (err) {
      console.error('Error calling SDM API:', err.message);
      return `Error: ${err.message}`;
    }
  });

  
this.on('CreateRepository', async (req) => {
    console.log("CreateRepository called");

    const { displayName, description, repositoryType, isVersionEnabled, isVirusScanEnabled, skipVirusScanForLargeFile, hashAlgorithms } = req.data;

    // Mandatory validation
    if (!displayName || !repositoryType) {
        return "Error: displayName and repositoryType are mandatory.";
    }

    try {
        console.log("Connecting to DMSAdmin destination...");
        const sdm = await cds.connect.to('DMSAdmin');
        console.log("Connected to DMSAdmin destination:", !!sdm);

        // Match Postman payload structure
        const payload = {
            repository: {
                displayName,
                description,
                repositoryType,
                isVersionEnabled,
                isVirusScanEnabled,
                skipVirusScanForLargeFile,
                hashAlgorithms
            }
        };

        const response = await sdm.send({
            method: 'POST',
            path: '/rest/v2/repositories',
            data: payload,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        console.log("Create Repository Response:", response);
        return response;
    } catch (err) {
        console.error("Error creating repository:", err.message);
        return `Error: ${err.message}`;
    }
});

  //Update Repositories
  this.on('UpdateRepository', async (req) => {
        const { ID, displayName, repositoryType, description, isVersionEnabled, isVirusScanEnabled, skipVirusScanForLargeFile, hashAlgorithms } = req.data;

        if (!ID) return "Error: ID is mandatory.";

        // Prepare payload as required by DMS API
        const payload = {
            repository: {
                displayName,
                description,
                repositoryType,
                isVersionEnabled,
                isVirusScanEnabled,
                skipVirusScanForLargeFile,
                hashAlgorithms
            }
        };

        try {
            const sdm = await cds.connect.to('DMSAdmin');
            const response = await sdm.send({
                method: 'PUT',
                path: `/rest/v2/repositories/${ID}`,
                data: payload,
                headers: { "Content-Type": "application/json" }
            });

            return response;
        } catch (err) {
            console.error("Error updating repository:", err.message);
            return `Error: ${err.message}`;
        }
    });

   
    this.on('SyncRepositories', async (req) => {
    try {
        const sdm = await cds.connect.to('DMSAdmin');
        const response = await sdm.send({
            method: 'GET',
            path: `/rest/v2/repositories/sync`,
            headers: {
                "Accept": "application/json"
            }
        });

        return response;  
    } catch (err) {
        console.error("Error syncing repositories:", err.message, err.response?.data);
        return `Error: ${err.message}`;
    }
});

// Create folder Services

async function formToBuffer(form) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const writable = new stream.Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });
    writable.on('finish', () => resolve(Buffer.concat(chunks)));
    writable.on('error', reject);
    form.pipe(writable);
  });
}

 this.on('CreateFolder', async (req) => {
    try {
      const { repositoryId, properties, succinct } = req.data;

      if (!repositoryId || !properties || properties.length === 0) {
        return req.error(400, "repositoryId and properties are required");
      }

      // Prepare form-data
      const form = new FormData();
      form.append('cmisaction', 'createFolder');

      properties.forEach((prop, idx) => {
        form.append(`propertyId[${idx}]`, prop.propertyId);
        form.append(`propertyValue[${idx}]`, prop.propertyValue);
      });

      if (succinct !== undefined) {
        form.append('succinct', succinct.toString());
      }

      // Convert form-data stream to Buffer
      const formBuffer = await formToBuffer(form);

      // Get destination
      const dms = await cds.connect.to('DMSAdmin');

      // Send request with buffer body
      const response = await dms.send({
        method: 'POST',
        path: `/browser/${repositoryId}/root`,
        data: formBuffer,
        headers: form.getHeaders()
      });

      return JSON.stringify(response);

    } catch (err) {
      console.error("Error creating folder:", err.message, err.response?.data);
      return { error: err.message, details: err.response?.data };
    }
  });

  //  Create Folder in a specific Location Path
  this.on('CreateFolderInPath', async (req) => {
    try {
      const { repositoryId, directoryPath, properties, succinct } = req.data;

      if (!repositoryId || !directoryPath || !properties || properties.length === 0) {
        return req.error(400, "repositoryId, directoryPath and properties are required");
      }

      // Prepare form-data
      const form = new FormData();
      form.append('cmisaction', 'createFolder');

      properties.forEach((prop, idx) => {
        form.append(`propertyId[${idx}]`, prop.propertyId);
        form.append(`propertyValue[${idx}]`, prop.propertyValue);
      });

      if (succinct !== undefined) {
        form.append('succinct', succinct.toString());
      }

      // Convert form-data to Buffer
      const formBuffer = await formToBuffer(form);

      // Get destination service
      const dms = await cds.connect.to('DMSAdmin');

      // Build path dynamically
      //const encodedPath = encodeURIComponent(directoryPath);
      const encodedPath = encodeURI(directoryPath);
      const fullPath = `/browser/${repositoryId}/root/${encodedPath}`;

      // Send request
      const response = await dms.send({
        method: 'POST',
        path: fullPath,
        data: formBuffer,
        headers: form.getHeaders()
      });

      return JSON.stringify(response);

    } catch (err) {
      console.error("Error creating folder in path:", err.message, err.response?.data);
      return { error: err.message, details: err.response?.data };
    }
  });
  
  // GET Object API Creation
  
  this.on('GetRootObjects', async (req) => {
  const { repository_id } = req.data;  
  console.log(`GetRootObjects called for repository_id: ${repository_id}`);
  try {
    const sdm = await cds.connect.to('DMSAdmin');
    console.log("Connected to DMSAdmin destination:", sdm !== undefined);
    const response = await sdm.send({
      method: 'GET',
      path: `/browser/${repository_id}/root`
    });
    console.log("API Response:", response);
    return response;

  } catch (err) {
    console.error('Error calling SDM API:', err.message);
    return `Error: ${err.message}`;
  }
});

this.on('GetObjectLocation', async (req) => {
  const { repository_id, directory_path } = req.data;

  if (!repository_id || !directory_path) {
    return "Error: repository_id and directory_path are mandatory.";
  }

  try {
    console.log(`Fetching object details for repo: ${repository_id}, path: ${directory_path}`);

    const sdm = await cds.connect.to('DMSAdmin');
    console.log("Connected to DMSAdmin destination");

    // Call the API: /browser/{repository_id}/root/{directory_path}
    const response = await sdm.send({
      method: 'GET',
      path: `/browser/${repository_id}/root/${encodeURI(directory_path)}`
    });

    console.log("Object details response:", response);
    return response;

  } catch (err) {
    console.error("Error fetching object details:", err.message);
    return `Error: ${err.message}`;
  }
});

this.on("CreateDocument", async (req) => {
  try {
    const { repositoryId, fileName, media } = req.data;

    if (!repositoryId || !fileName || !media) {
      return req.error(400, "repositoryId, fileName, and media are required");
    }

    // Convert Base64 → Buffer
    const buffer = Buffer.from(media, "base64");

    const form = new FormData();
    form.append("cmisaction", "createDocument");
    form.append("propertyId[0]", "cmis:objectTypeId");
    form.append("propertyValue[0]", "cmis:document");
    form.append("propertyId[1]", "cmis:name");
    form.append("propertyValue[1]", fileName);
    form.append("succinct", "true");
    form.append("includeAllowableActions", "true");
    form.append("media", buffer, { filename: fileName });

    
    const formBuffer = await formToBuffer(form);

    const dms = await cds.connect.to("DMSAdmin");

    const response = await dms.send({
      method: "POST",
      path: `/browser/${repositoryId}/root`,
      data: formBuffer,
      headers: form.getHeaders()
    });

    return response;

  } catch (err) {
    console.error("Error creating document:", err.message, err.response?.data);
    return { error: err.message, details: err.response?.data };
  }
});


// Create Document in Particular Path
this.on("CreateDocumentInPath", async (req) => {
  try {
    const { repositoryId, directoryPath, fileName, media } = req.data;

    if (!repositoryId || !directoryPath || !fileName || !media) {
      return req.error(400, "repositoryId, directoryPath, fileName, and media are required");
    }

    // Convert Base64 → Buffer
    const buffer = Buffer.from(media, "base64");

    const form = new FormData();
    form.append("cmisaction", "createDocument");
    form.append("propertyId[0]", "cmis:objectTypeId");
    form.append("propertyValue[0]", "cmis:document");
    form.append("propertyId[1]", "cmis:name");
    form.append("propertyValue[1]", fileName);
    form.append("succinct", "true");
    form.append("filename", fileName);
    form.append("includeAllowableActions", "true");
    form.append("media", buffer, { filename: fileName });

    // 🔑 Convert FormData stream → Buffer
    const formBuffer = await formToBuffer(form);

    const dms = await cds.connect.to("DMSAdmin");

    const response = await dms.send({
      method: "POST",
      // ensure directoryPath is URI-encoded to handle spaces/special chars
      path: `/browser/${repositoryId}/root/${encodeURI(directoryPath)}`,
      data: formBuffer,
      headers: form.getHeaders()
    });

    return response;

  } catch (err) {
    console.error("Error creating document in path:", err.message, err.response?.data);
    return { error: err.message, details: err.response?.data };
  }
});


//Get Repository Tree

this.on("GetRepositoryTree", async (req) => {
  const { repository_id } = req.data;
  if (!repository_id) return { error: "repository_id is mandatory" };

  const sdm = await cds.connect.to("DMSAdmin");

  // Normalize CMIS object to a simple node
  const normalizeNode = (obj) => {
    const props = obj.object?.properties || {};
    return {
      id: props["cmis:objectId"]?.value,
      name: props["cmis:name"]?.value,
      type: props["cmis:baseTypeId"]?.value?.includes("folder")
        ? "folder"
        : "document",
      children: []
    };
  };

  // Recursive folder traversal
  const traverseFolder = async (folderPath = "") => {
    const apiPath = folderPath
      ? `/browser/${repository_id}/root/${encodeURI(folderPath)}`
      : `/browser/${repository_id}/root`;

    let res;
    try {
      res = await sdm.send({
        method: "GET",
        path: apiPath,
        headers: { Accept: "application/json" }
      });
    } catch (err) {
      console.error(` Error fetching folder path "${folderPath}":`, err.message);
      return [];
    }

    const objects = res?.objects || [];
    const nodes = [];

    for (const obj of objects) {
      const node = normalizeNode(obj);

      if (node.type === "folder") {
        const subPath = folderPath ? `${folderPath}/${node.name}` : node.name;
        node.children = await traverseFolder(subPath); 
      }

      nodes.push(node);
    }

    return nodes;
  };

  try {
    const tree = await traverseFolder(); // start from root
    return { repository_id, tree };
  } catch (err) {
    console.error(" Error in GetRepositoryTree:", err.message);
    return { error: err.message };
  }
});

 this.on("filedownload", async (req) => {
    try {
      const { repositoryId, objectId, filename, preview } = req.data || {};
      if (!repositoryId || !objectId || !filename) {
        return req.error(400, "repositoryId, objectId and filename are required");
      }

      // Fetch raw binary from DMS via destination
      const response = await executeHttpRequest(
        { destinationName: "DMSAdmin" },
        {
          method: "GET",
          url: `/browser/${repositoryId}/root`,
          params: {
            cmisselector: "content",
            objectId: objectId,
            download: "attachment",
            filename: filename
          },
          responseType: "arraybuffer"   // IMPORTANT: get raw bytes
        }
      );

      // Convert ArrayBuffer to Node Buffer
      const buffer = Buffer.from(response.data);

      console.log(`File download OK, size: ${buffer.length} bytes`);

      // Detect MIME type
      const contentType = mime.lookup(filename) || "application/octet-stream";

      // Prepare HTTP headers
      const res = req.res;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", buffer.length);

      // Decide inline (preview) vs attachment (download)
      if (preview && (contentType.startsWith("image/") || contentType === "application/pdf")) {
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      } else {
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      }

      // Send binary response
      res.end(buffer);

      // Stop CAP from sending JSON
      return;

    } catch (err) {
      console.error("Download error:", {
        message: err.message,
        stack: err.stack,
        status: err.response?.status,
        data: err.response?.data,
      });
      return req.error(500, "File download failed: " + err.message);
    }
  });


  //Move Folder Moves an object from source folder to the targeted folder

    this.on("MoveObject", async (req) => {
    try {
      const { repositoryId, objectId, sourceFolderId, targetFolderId } = req.data;

      if (!repositoryId || !objectId || !sourceFolderId || !targetFolderId) {
        return req.error(400, "repositoryId, objectId, sourceFolderId, and targetFolderId are required");
      }

      const dms = await cds.connect.to("DMSAdmin");

      // Prepare form-data
      const form = new FormData();
      form.append("cmisaction", "move");
      form.append("objectId", objectId);
      form.append("sourceFolderId", sourceFolderId);
      form.append("targetFolderId", targetFolderId);

      // Convert to Buffer like in CreateFolder
      const formBuffer = await formToBuffer(form);

      // Send to DMS
      const response = await dms.send({
        method: "POST",
        path: `/browser/${repositoryId}/root`,
        data: formBuffer,
        headers: form.getHeaders()
      });

      return JSON.stringify(response);
    } catch (err) {
      console.error("Error moving object:", err.message, err.response?.data);
      return { error: err.message, details: err.response?.data };
    }
  });

  //Copy Document Copies document from source folder to the targeted folder
  this.on("CopyDocument", async (req) => {
    try {
      const { repositoryId, objectId, sourceId } = req.data;

      if (!repositoryId || !objectId || !sourceId) {
        return req.error(400, "repositoryId, objectId (target folder), and sourceId (document) are required");
      }

      const dms = await cds.connect.to("DMSAdmin");

      // Prepare form-data
      const form = new FormData();
      form.append("cmisaction", "createDocumentFromSource");
      form.append("objectId", objectId);  // target folder id
      form.append("sourceId", sourceId);  // source document id

      // Convert FormData to Buffer
      const formBuffer = await formToBuffer(form);

      // Send request to DMS
      const response = await dms.send({
        method: "POST",
        path: `/browser/${repositoryId}/root`,
        data: formBuffer,
        headers: form.getHeaders()
      });

      return JSON.stringify(response);
    } catch (err) {
      console.error("Error copying document:", err.message, err.response?.data);
      return { error: err.message, details: err.response?.data };
    }
  });   

// Create Link 


});
