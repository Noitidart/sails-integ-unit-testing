import React, { useState } from 'react';
import classnames from 'classnames';
import { Form, Field } from 'react-final-form';
import moment from 'moment';
import { pick } from 'lodash';

function EditableRow({ isLoggedIn, result, _csrf, shouldShowTools }) {
  const [isEditing, setIsEditing] = useState(false);

  const submit = async (values, { reset }) => {
    const nextValues = {
      ...pick(values, 'destination', 'name', 'status'),
    };

    // slow it down so the speed doesn't give people a headache
    await new Promise(resolve => setTimeout(resolve, 500));

    const res = await fetch('/api/v1/orders/' + result.clientId, {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': _csrf },
      body: JSON.stringify(nextValues)
    });

    if (res.status !== 201) {
      alert('Failed to updated, status code: ' + res.status);
    } else {
      setIsEditing(false);
      const updatedOrder = await res.json();
      setTimeout(() => reset(updatedOrder), 0);
    }
  };

  const startEditing = () => {
    if (isLoggedIn) {
      setIsEditing(true);
    } else {
      alert(
        'You are not logged in! Only logged in users can edit. Login as "admin@eample.com" with password "abc123".'
      );
    }
  };
  return (
    <Form onSubmit={submit} initialValues={result}>
      {({ handleSubmit, pristine, submitting, initialValues }) => {
        return (
          <form onSubmit={handleSubmit}>
            <div className="row text-center py-3">
              <div className="col-1 font-weight-bold">{result.orderNumber}</div>
              <div className="col-2">
                {!isEditing ? (
                  initialValues.status
                ) : (
                  <Field component="select" name="status" className="form-control" disabled={submitting}>
                    <option value="CREATED">CREATED</option>
                    <option value="COOKED">COOKED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="DRIVER_RECEIVED">DRIVER_RECEIVED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </Field>
                )}
              </div>
              <div className="col-2">
                {!isEditing ? (
                  initialValues.name
                ) : (
                  <Field component="input" type="text" name="name" className="form-control" disabled={submitting} />
                )}
              </div>
              <div className="col-4">
                {!isEditing ? (
                  initialValues.destination
                ) : (
                  <Field
                    component="input"
                    type="text"
                    name="destination"
                    className="form-control"
                    disabled={submitting}
                  />
                )}
              </div>
              <div className="col-2">{moment.utc(result.updatedAt).format('[Today] LTS')}</div>
              <div className="col-1">
                {shouldShowTools && (
                  <>
                    {!isEditing && (
                      <button type="button" className="btn btn-sm btn-link" onClick={startEditing}>
                        <i className="fa fa-pencil" />
                      </button>
                    )}
                    {!submitting && isEditing && (
                      <button
                        type="button"
                        className={classnames('btn btn-sm btn-link', !pristine && 'text-success')}
                        onClick={handleSubmit}
                        disabled={pristine}
                      >
                        <i className="fa fa-check" />
                      </button>
                    )}
                    {!submitting && isEditing && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger"
                        onClick={() => setIsEditing(false)}
                      >
                        <i className="fa fa-close" />
                      </button>
                    )}
                    {isEditing && submitting && <i>Saving</i>}
                  </>
                )}
              </div>
            </div>
          </form>
        );
      }}
    </Form>
  );
}

export default EditableRow;
