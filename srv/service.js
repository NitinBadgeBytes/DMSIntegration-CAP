const cds = require('@sap/cds');
const FormData = require("form-data");
const stream = require('stream');

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

  //Create Repositories

  // this.on('CreateRepository', async (req) => {
  //   console.log("CreateRepository called");

  //   const { repository } = req.data;

  //   // Mandatory validation
  //   if (!repository.displayName || !repository.repositoryType) {
  //     return "Error: displayName and repositoryType are mandatory.";
  //   }

  //   try {
  //     console.log("Connecting to DMSAdmin destination...");
  //     const sdm = await cds.connect.to('DMSAdmin');
  //     console.log("Connected to DMSAdmin destination:", !!sdm);

  //     const response = await sdm.send({
  //       method: 'POST',
  //       path: '/rest/v2/repositories',
  //       data: repository,
  //       headers: {
  //         "Content-Type": "application/json"
  //       }
  //     });

  //     console.log("Create Repository Response:", response);
  //     return response;
  //   } catch (err) {
  //     console.error("Error creating repository:", err.message);
  //     return `Error: ${err.message}`;
  //   }
  // });
  // Create Repositories
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


    // DELETE handler - delete repository
    // this.on("DeleteRepository", async (req) => {
    //     const { ID } = req.data;

    //     // Ensure the repository exists
    //     const repo = await SELECT.one.from(Repository).where({ ID });
    //     if (!repo) return req.error(404, `Repository with ID ${ID} not found`);

    //     // Perform delete
    //     await DELETE.from(Repository).where({ ID });

    //     return `Repository ${ID} deleted successfully`;
    // });
   
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

//  Create Document
 this.on('CreateDocument', async (req) => {
  try {
    const { repositoryId, fileName, media } = req.data; 

    const form = new FormData();
    form.append("cmisaction", "createDocument");
    form.append("propertyId[0]", "cmis:objectTypeId");
    form.append("propertyValue[0]", "cmis:document");
    form.append("propertyId[1]", "cmis:name");
    form.append("propertyValue[1]", fileName);
    form.append("succinct", "true");
    form.append("filename", fileName);
    form.append("includeAllowableActions", "true");
    form.append("media", media); // 

    const dms = await cds.connect.to("DMSAdmin");

    const response = await dms.send({
      method: "POST",
      path: `/browser/${repositoryId}/root`,
      data: form,
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

    const form = new FormData();
    form.append("cmisaction", "createDocument");
    form.append("propertyId[0]", "cmis:objectTypeId");
    form.append("propertyValue[0]", "cmis:document");
    form.append("propertyId[1]", "cmis:name");
    form.append("propertyValue[1]", fileName);
    form.append("succinct", "true");
    form.append("filename", fileName);
    form.append("includeAllowableActions", "true");
    form.append("media", media); // binary file

    const dms = await cds.connect.to("DMSAdmin");

    const response = await dms.send({
      method: "POST",
      path: `/browser/${repositoryId}/root/${encodeURI(directoryPath)}`,
      data: form,
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
//Document Download




















});
