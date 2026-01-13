// import { getDomainUrl } from "@/services/urldomain";
// import axios from "axios";

// export interface APIResponse {
//   Status: "success" | "error";
//   Error?: string;
//   data?: any;
//   IdN?: number;
//   EnableCurrency?: boolean;
//   Currency?: Array<{ IdN: number; NameC: string }>;
// }



// export interface DocumentFile {
//   uri: string;
//   type: string;
//   name: string;
// }

// /**
//  * Axios instance WITHOUT baseURL
//  */
// const api = axios.create({
//   timeout: 30000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export const ClaimAPI = {
//   /**
//    * Get claim types & currency list
//    */
//   getClaimList: async (token: string): Promise<APIResponse> => {
//     try {
//       const domainUrl = await getDomainUrl();

//       const response = await api.post<APIResponse>(
//         `${domainUrl}/WebApi/GetEClaimList`,
//         {
//           TokenC: token,
//         }
//       );

//       return response.data;
//     } catch (error) {
//       console.error("Error fetching claim list:", error);
//       throw error;
//     }
//   },

//   /**
//    * Submit claim data
//    */
//   updateClaim: async (
//     token: string,
//     claimData: ClaimData
//   ): Promise<APIResponse> => {
//     try {
//       const domainUrl = await getDomainUrl();

//       const payload = {
//         TokenC: token,
//         ...claimData,
//       };

//       console.log("Submitting claim data:", payload);

//       const response = await api.post<APIResponse>(
//         `${domainUrl}/WebApi/UpdateClaim`,
//         payload
//       );

//       return response.data;
//     } catch (error) {
//       console.error("Error submitting claim:", error);
//       throw error;
//     }
//   },

//   /**
//    * Upload claim documents
//    */
//   updateClaimDoc: async (
//     token: string,
//     claimId: number,
//     files: DocumentFile[]
//   ): Promise<APIResponse> => {
//     try {
//       const domainUrl = await getDomainUrl();

//       const formData = new FormData();
//       formData.append("TokenC", token);
//       formData.append("IdN", claimId.toString());

//       files.forEach((file, index) => {
//         formData.append(`File[${index}]`, {
//           uri: file.uri,
//           type: file.type,
//           name: file.name,
//         } as any);
//       });

//       const response = await axios.post<APIResponse>(
//         `${domainUrl}/WebApi/UpdateClaimDoc`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       console.error("Error uploading documents:", error);
//       throw error;
//     }
//   },
// };

// export default ClaimAPI;
