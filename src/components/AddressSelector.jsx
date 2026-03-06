import React, { useState } from "react";
import { MapPin } from "lucide-react";
import {
  getDepartements,
  getCommunes,
  getArrondissements,
} from "../data/beninLocations";

const AddressSelector = ({ value, onChange, error, register, setValue }) => {
  // Parse the current value to get individual components
  const parseValue = (val) => {
    if (!val) return { departement: "", commune: "", arrondissement: "" };
    const parts = val.split(",").map((part) => part.trim());
    return {
      departement: parts[0] || "",
      commune: parts[1] || "",
      arrondissement: parts[2] || "",
    };
  };

  const parsed = parseValue(value);
  const [departement, setDepartement] = useState(parsed.departement);
  const [commune, setCommune] = useState(parsed.commune);
  const [arrondissement, setArrondissement] = useState(parsed.arrondissement);

  // Update local state when value prop changes externally
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    const newParsed = parseValue(value);
    setDepartement(newParsed.departement);
    setCommune(newParsed.commune);
    setArrondissement(newParsed.arrondissement);
    setLastValue(value);
  }

  const departements = getDepartements();
  const communes = departement ? getCommunes(departement) : [];
  const arrondissements =
    departement && commune ? getArrondissements(departement, commune) : [];

  const updateAddress = (dep, com, arr) => {
    let address = "";
    if (dep && com) {
      address = `${dep}, ${com}`;
      if (arr) {
        address += `, ${arr}`;
      }
    }

    // Update form value
    if (setValue) {
      setValue("adresse_siege", address);
    }

    if (onChange) {
      onChange(address);
    }
  };

  const handleDepartementChange = (e) => {
    const newDepartement = e.target.value;
    setDepartement(newDepartement);
    setCommune("");
    setArrondissement("");
    updateAddress(newDepartement, "", "");
  };

  const handleCommuneChange = (e) => {
    const newCommune = e.target.value;
    setCommune(newCommune);
    setArrondissement("");
    updateAddress(departement, newCommune, "");
  };

  const handleArrondissementChange = (e) => {
    const newArrondissement = e.target.value;
    setArrondissement(newArrondissement);
    updateAddress(departement, commune, newArrondissement);
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            Adresse du siège *
          </span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Département */}
          <div className="form-control">
            <label className="label">
              <span className="label-text-alt text-gray-600">
                Département *
              </span>
            </label>
            <select
              className={`select select-bordered w-full h-12 text-base transition-colors ${error ? "select-error border-red-300" : "focus:border-primary"}`}
              value={departement}
              onChange={handleDepartementChange}
            >
              <option value="">Sélectionner...</option>
              {departements.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          {/* Commune */}
          <div className="form-control">
            <label className="label">
              <span className="label-text-alt text-gray-600">Commune *</span>
            </label>
            <select
              className={`select select-bordered w-full h-12 text-base transition-colors ${error ? "select-error border-red-300" : "focus:border-primary"}`}
              value={commune}
              onChange={handleCommuneChange}
              disabled={!departement}
            >
              <option value="">Sélectionner...</option>
              {communes.map((com) => (
                <option key={com} value={com}>
                  {com}
                </option>
              ))}
            </select>
          </div>

          {/* Arrondissement */}
          <div className="form-control">
            <label className="label">
              <span className="label-text-alt text-gray-600">
                Arrondissement
              </span>
            </label>
            <select
              className={`select select-bordered w-full h-12 text-base transition-colors ${error ? "select-error border-red-300" : "focus:border-primary"}`}
              value={arrondissement}
              onChange={handleArrondissementChange}
              disabled={!commune}
            >
              <option value="">Sélectionner...</option>
              {arrondissements.map((arr) => (
                <option key={arr} value={arr}>
                  {arr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hidden input for react-hook-form */}
        <input type="hidden" {...register("adresse_siege")} />

        {/* Display current selection */}
        {departement && commune && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-600">
              Adresse sélectionnée:{" "}
              <span className="font-medium">
                {departement}, {commune}
                {arrondissement ? ", " + arrondissement : ""}
              </span>
            </span>
          </div>
        )}

        {error && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {error.message}
            </span>
          </label>
        )}
      </div>
    </div>
  );
};

export default AddressSelector;
