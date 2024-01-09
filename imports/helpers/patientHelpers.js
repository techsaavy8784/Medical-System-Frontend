/***** all patients related helpers can be added here *****/

import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Router } from "meteor/iron:router"

export const patientHelpers = {
    async getPatients(coreUrl, query, headers) {
        return new Promise(function (resolver, reject) {
            console.log("find-patientURL", `${coreUrl}${query}`);
            Meteor.call(
                "patientTestQuery",
                `${coreUrl}/${query}`,
                headers,
                (error, result) => {
                    if (error) {
                        console.log("errorFinding", error)
                        if (error.error?.response?.statusCode === 401) {
                            alert("Your session has expired, please login");
                            Session.set("isLogin", false)
                            Session.set("isFindLoading", false)

                            Router.go("/login");
                        }
                        Session.set("isFindLoading", false)
                        reject(error)
                        // return error;
                    } else {
                        console.log("success: ", result)
                        if (Session.get("isActive") === "hospital") {
                            if (result.status === 200 && result.message === " No resources found") {

                                resolver(result)
                            } else {
                                resolver(result)
                            }
                        } else {
                            if (result.statusCode === 404) {
                                resolver(result)

                            } else {
                                resolver(result)
                            }
                        }
                        Session.set("isFindLoading", false)
                    }
                }
            )
        }).catch((error) => {
            console.log("errorFinding", error)
        })
    },

    //this helper will reset current user info when user
    //switch between local and remote
    setCurrentPatient(activePatient, patientDisplaySummary) {
        Session.set("currentPatientInfo", patientDisplaySummary);
        // Session.set("currentPatientData", this);
        Session.set("currentPatientID", activePatient.id);
        Session.set("currentPatienDOB", activePatient?.DOB);
        Session.set("currentPatientName", activePatient?.name[0]?.text);
        // Session.set("selectedPatientInfo", this);
        Session.set("patientMrn", activePatient.id);
        Session.set("fhirModalData", activePatient.text.div);
    },

    //this helper will reset current user info when user
    //switch between local and remote
    resetCurrentPatient() {
        Session.set("currentPatientInfo", null);
        Session.set("currentPatientData", null);
        Session.set("currentPatientID", null);
        Session.set("currentPatienDOB", null);
        Session.set("currentPatientName", null);
        Session.set("selectedPatientInfo", null);
        Session.set("patientMrn", null);
        Session.set("fhirModalData", null);
        // Router.go(`/find-patient`)
    },

    //below functions save active patients only in session
    //first it check if both params supplied then it save new values
    //else it will check for old values and set the session
    //in case both not found it will do nothing
    setActiveLocalPatient(patient, displaySummary) {
        if(patient && displaySummary){
            Session.set('localActivePatient', patient);
            Session.set('localActivePatientSummary', displaySummary);
        } else {
            patient = Session.get('localActivePatient');
            displaySummary = Session.get('localActivePatientSummary');
        }
        if(patient && displaySummary) {
            this.setCurrentPatient(patient, displaySummary);
        } else {
            this.resetCurrentPatient();
        }
    },
    //below functions save active patients only in session
    //first it check if both params supplied then it save new values
    //else it will check for old values and set the session
    //in case both not found it will do nothing
    setActiveRemotePatient(patient, displaySummary) {
        if(patient && displaySummary){
            Session.set('remoteActivePatient', patient);
            Session.set('remoteActivePatientSummary', displaySummary);
        } else {
            patient = Session.get('remoteActivePatient');
            displaySummary = Session.get('remoteActivePatientSummary');
        }
        if(patient && displaySummary) {
            this.setCurrentPatient(patient, displaySummary);
        } else {
            this.resetCurrentPatient();
        }
    }
};