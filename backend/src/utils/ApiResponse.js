export default class ApiResponse {
  constructor(statusCode , message ="status", data) {
    this.statuscode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode<400; 
  
  }
}

