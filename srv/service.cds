
service DMS {
    function GetRepositories() returns array of String;
    function SyncRepositories() returns array of String;
    action GetRootObjects(repository_id: String) returns String;
    action GetObjectLocation(repository_id: String, directory_path: String) returns String;
    action GetRepositoryTree(repository_id : String) returns LargeString;
    action CreateRepository(
            displayName        : String,
            description        : String,
            repositoryType     : String,
            isVersionEnabled   : String,
            isVirusScanEnabled : String,
            skipVirusScanForLargeFile : String,
            hashAlgorithms     : String
     
    ) returns String;
    action UpdateRepository(
    ID                 : String,
    displayName        : String,
    description        : String,
    repositoryType     : String,
    isVersionEnabled   : String,  
    isVirusScanEnabled : String,  
    skipVirusScanForLargeFile : String,  
    hashAlgorithms     : String
) returns String;
     action DeleteRepository(
        ID : String
    ) returns String;

    //Create Folder in Repo

     action CreateFolder(
    repositoryId : String,
    properties   : array of {
      propertyId    : String;
      propertyValue : String;
    },
    succinct     : Boolean
  ) returns String;

  //Create Folder in Particular location

     action CreateFolderInPath(
    repositoryId   : String,    // repository id
    directoryPath  : String,    // folder path inside repository
    properties     : array of {
      propertyId    : String;
      propertyValue : String;
    },
    succinct       : Boolean
  ) returns String;

  //For Documents

  action CreateDocument(repositoryId: String, fileName: String, media: LargeBinary) returns String;
  action CreateDocumentInPath(
  repositoryId : String,
  directoryPath : String,
  fileName     : String,
  media        : LargeBinary
) returns String;


}