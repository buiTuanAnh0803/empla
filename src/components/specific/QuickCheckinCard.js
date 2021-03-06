import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useToasts } from "react-toast-notifications";
import { MdNoteAdd } from "react-icons/md";
import styled from "styled-components";
import { selectUserCredential } from "../../features/userSlice";
import {
  selectLoading,
  selectError,
  selectCheckinTableData,
  selectNewCheckinData,
  createNewCheckin,
  retriveCheckinList,
  setNewCheckinData,
} from "../../features/checkinSlice";
import Card from "../common/Card";
import Col from "../layout/Col";
import Row from "../layout/Row";
import Button from "../common/Button";
import { selectTimeNow } from "../../features/timeSlice";
import { selectPos } from "../../features/geolocationSlice";
import Dropdown from "../common/Dropdown";

function QuickCheckinCard() {
  const [isCheckAvailable, setCheckStatus] = useState(false);
  const [isCheckIn, setCheckIn] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState("");
  const [notes, setNotes] = useState("");
  const userCredential = useSelector(selectUserCredential);

  const dispatch = useDispatch();
  const { addToast } = useToasts();
  const loading = useSelector(selectLoading);
  const checkinList = useSelector(selectCheckinTableData);
  const error = useSelector(selectError);
  const newCheckin = useSelector(selectNewCheckinData);
  const now = useSelector(selectTimeNow);
  const currentPosition = useSelector(selectPos);

  /* eslint-disable */
  useEffect(() => {
    if (checkinList || newCheckin) {
      let lastCheck = checkinList[0];
      if (lastCheck) {
        for (let i = 1; i < checkinList.length; i++) {
          const recordData = checkinList[i];
          const createdTimeStr = recordData.fields.CreatedDate;
          const lastCheckTimeStr = lastCheck.fields.CreatedDate;
          if (Date.parse(createdTimeStr) > Date.parse(lastCheckTimeStr)) {
            lastCheck = recordData;
          }
        }
        // the Type's index is 2 in the fieldList
        if (lastCheck.fields.Type === "Check-in") {
          setCheckIn(false);
        } else {
          setCheckIn(true);
        }
        setLastCheckTime(
          new Date(lastCheck.fields.CreatedDate).toLocaleString()
        );

        // we check at least 4 hours for creating a new check-in/out
        const lastCheckTime = Date.parse(lastCheck.fields.CreatedDate);
        if (now - lastCheckTime >= 1 * 60 * 60 * 1000) {
          setCheckStatus(true);
        } else {
          setCheckStatus(false);
        }
      } else {
        setCheckStatus(true);
      }

      if (newCheckin) {
        addToast(`Create a new ${newCheckin.fields.Type} successfully!`, {
          appearance: "info",
        });
        setCheckStatus(false);
        dispatch(setNewCheckinData(null));
        dispatch(retriveCheckinList(userCredential.StaffId[0]));
      }
    } else {
      if (error) {
        console.log(error);
        addToast("An error occurs", { appearance: "error" });
      } else {
        if (userCredential) {
          dispatch(retriveCheckinList(userCredential.StaffId[0]));
        }
      }
    }
  }, [userCredential, checkinList, error, newCheckin, now]);

  const handleCheckIn = (e) => {
    e.preventDefault();
    const { lat, lng } = currentPosition;
    dispatch(
      createNewCheckin({
        Type: "Check-in",
        Notes: notes,
        Staff: userCredential.Staff,
        CoordinatePosition: `${lat} ${lng}`,
      })
    );
  };

  const handleCheckOut = (e) => {
    e.preventDefault();
    const { lat, lng } = currentPosition;
    dispatch(
      createNewCheckin({
        Type: "Check-out",
        Notes: notes,
        Staff: userCredential.Staff,
        CoordinatePosition: `${lat} ${lng}`,
      })
    );
  };

  return (
    <Card
      inactive={!isCheckAvailable}
      isLoading={loading}
      cardHeader={{
        title: loading ? "" : isCheckIn ? "Check-in" : "Check-out",
        rightTitle: isCheckAvailable && (
          <Dropdown
            title={<MdNoteAdd size="20px" />}
            variant="link"
            position="right"
            style={{
              marginRight: "3px",
            }}
            boxStyle={{
              backgroundColor: "#D0FAF9",
              boxShadow: "0 1px 8px 0 #6E84A3",
              padding: "5px 8px",
            }}
          >
            <TextAreaForNotes
              style={{ backgroundColor: "#D0FAF9" }}
              className="form-coltrol border border-0"
              placeholder="Addition notes"
              onChange={(e) => setNotes(e.target.value)}
              value={notes}
            />
          </Dropdown>
        ),
        extension: true,
      }}
      isHasHideCard
      elementList={[
        <Col columnSize={["auto"]}>
          <Row>
            <p>
              {isCheckAvailable
                ? `Create a new check-${
                    isCheckIn ? "in" : "out"
                  } for today before working`
                : `You have processed the check recently, last check ${
                    isCheckIn ? "out" : "in"
                  }: ${lastCheckTime}`}
            </p>
          </Row>
          {isCheckAvailable && (
            <Row className="justify-content-end">
              <Button
                className="py-2 px-4"
                onClick={isCheckIn ? handleCheckIn : handleCheckOut}
              >
                {isCheckIn ? "Check-in" : "Check-out"}
              </Button>
            </Row>
          )}
        </Col>,
      ]}
    />
  );
}

const TextAreaForNotes = styled.textarea`
  padding: 5px 8px;
  &:active,
  &:focus {
    outline: none !important;
  }
`;

export default QuickCheckinCard;
