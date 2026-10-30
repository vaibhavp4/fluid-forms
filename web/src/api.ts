export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const token=sessionStorage.getItem('fieldnote-owner-token');
 const response=await fetch('/api'+path,{method,headers:{...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
 if(!response.ok){let message='Request failed. Please try again.';try{const error=await response.json();message=typeof error.detail==='string'?error.detail:JSON.stringify(error.detail);}catch{} throw new Error(message);}
 return response.json();
}
export const errorMessage=(error:unknown)=>error instanceof Error?error.message:'Something went wrong. Please try again.';
