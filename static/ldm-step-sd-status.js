/* Read completed diagnostic output; never infer FTPS readiness from MQTT. */
window.ldmStepSdDiagnosticStatus=(connected,ip,text)=>{
 if(!connected)return 'WAITING';
 const value=String(text).toUpperCase(),host=value.match(/HOST[^0-9]*(\d+\.\d+\.\d+\.\d+)/)?.[1];
 if(host&&ip&&ip!=='—'&&host!==ip)return 'NOT TESTED';
 if(/RESULT[^\n]*\bFAIL\b|TEST ERROR/.test(value))return 'FAILED';
 if(/RESULT[^\n]*\bPASS\b/.test(value))return 'READY ✓';
 if(/TESTING TCP|TESTING.*FTPS/.test(value))return 'CHECKING…';
 return 'NOT TESTED';
};
