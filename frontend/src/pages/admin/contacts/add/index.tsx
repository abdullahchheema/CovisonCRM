import React, { useState } from "react";
import { useFormik } from "formik";
import { makeEmptyContact, contactValidationSchema } from "../helpers";
import toast from "react-hot-toast";
import {
  CustomSelectField,
  CustomTextField,
  PageHeader,
  CardSection,
} from "@/components/custom";
import { Button } from "@/components/ui/button";
import { apiContacts } from "@/services/models/contactsModel";
import { UserRound, TrendingUp, Building2, Tags as TagsIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEnums } from "@/hooks/useEnums";
import { toLabelItems } from "@/utils";
import { TagSelector } from "@/components/common";

const AddContact = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { contactStatuses, contactPriorities } = useEnums();

  const { errors, values, handleChange, handleSubmit, touched, resetForm, setFieldValue } =
    useFormik({
      initialValues: makeEmptyContact(),
      validationSchema: contactValidationSchema,
      onSubmit: (vals) => {
        setIsLoading(true);
        apiContacts.post!({ ...vals, companySize: Number(vals.companySize) || 0 }, "", true).then((res) => {
          if (res && res._id) {
            toast.success("Contact added successfully");
            resetForm();
            navigate("/dashboard/contacts");
          } else {
            toast.error(res?.message ?? "Failed to add contact");
          }
          setIsLoading(false);
        });
      },
    });

  return (
    <section className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Add Contact"
        description="Create a new contact in your CRM"
        isBackButton
      />

      <div className="flex gap-2 flex-wrap">
        <CardSection
          icon={<UserRound className="h-4 w-4 text-primary" />}
          title="Basic Information"
          className="w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTextField
              label="Full Name"
              name="name"
              placeholder="ex: Jane Smith"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Email Address"
              name="email"
              placeholder="ex: jane@company.com"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Phone Number"
              name="number"
              placeholder="ex: +1 555 000 0000"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Company"
              name="company"
              placeholder="ex: Acme Corp"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Job Title"
              name="jobTitle"
              placeholder="ex: Product Manager"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Company Size"
              name="companySize"
              placeholder="ex: 250"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
              type="number"
            />
          </div>
        </CardSection>

        <CardSection
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          title="Lead Details"
          className="w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelectField
              label="Lead Status"
              name="status"
              placeholder="status"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
              labelItms={toLabelItems(contactStatuses)}
            />
            <CustomSelectField
              label="Priority"
              name="priority"
              placeholder="priority"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
              labelItms={toLabelItems(contactPriorities)}
            />
            <CustomTextField
              label="Probability (0–1)"
              name="probability"
              placeholder="ex: 0.7"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
          </div>
        </CardSection>

        <CardSection
          icon={<Building2 className="h-4 w-4 text-primary" />}
          title="Business Details"
          className="w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTextField
              label="LinkedIn URL"
              name="linkedinUrl"
              placeholder="ex: linkedin.com/in/janesmith"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Website"
              name="website"
              placeholder="ex: acme.com"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Country"
              name="country"
              placeholder="ex: USA"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="City"
              name="city"
              placeholder="ex: New York"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
            <CustomTextField
              label="Niche / Industry"
              name="niche"
              placeholder="ex: Wholesale Trade"
              values={values}
              handleChange={handleChange}
              touched={touched}
              errors={errors}
            />
          </div>
        </CardSection>

        <CardSection
          icon={<TagsIcon className="h-4 w-4 text-primary" />}
          title="Tags"
          className="w-full"
        >
          <TagSelector
            selectedIds={values.tagIds}
            onChange={(ids) => setFieldValue("tagIds", ids)}
          />
        </CardSection>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link to="/dashboard/contacts">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button loading={isLoading} onClick={() => handleSubmit()}>
          Add Contact
        </Button>
      </div>
    </section>
  );
};

export default AddContact;
