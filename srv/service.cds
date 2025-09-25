
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
    directoryPath  : String,    
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

//For MOve Object
  action MoveObject(
    repositoryId  : String,
    objectId      : String,
    sourceFolderId: String,
    targetFolderId: String
  ) returns String;
  
 action filedownload(
    repositoryId : String,
    objectId     : String,
    filename     : String,
    preview: Boolean
  ) returns String;

  //Copy Document
    action CopyDocument(
    repositoryId : String,
    objectId     : String,   
    sourceId     : String    
  ) returns String;
  
  //Create Link

  // action CreateLink(
  //   repositoryId     : String,
  //   linkName         : String,
  //   url              : String,
  //   parentFolderPath : String
  // ) returns String;
  
    action CreateShare(
        repositoryId : UUID,
        folderName   : String,
        succinct     : Boolean
    ) returns  String;

}